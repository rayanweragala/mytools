import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as ngrok from "ngrok";
import { store } from "./store.js";
import { EndpointConfig, EndpointKey } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, "../.env");

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const source = fs.readFileSync(filePath, "utf8");
  source.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      return;
    }

    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const unquoted = rawValue.replace(/^(['"])(.*)\1$/, "$2");
    process.env[key] = unquoted;
  });
}

loadEnvFile(ENV_PATH);

const PORT = Number(process.env.PORT || 8787);

type RequestWithRawBody = Request & { rawBody?: string };
type HeaderMap = Record<string, string | string[] | undefined>;

const blockedReplayHeaders = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "accept-encoding"
]);
const pendingReplaySignatures = new Map<string, number>();
let tunnelUrl: string | null = null;
const tunnelPortPattern = new RegExp(`:${PORT}$`);

function delay(ms: number): Promise<void> {
  if (!ms || ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeEndpointKey(value: string): EndpointKey | null {
  const { endpointKeys } = store.getState();
  if (endpointKeys.includes(value)) {
    return value as EndpointKey;
  }

  return null;
}

function validateAuth(req: Request, cfg: EndpointConfig): boolean {
  if (cfg.authType === "NONE") {
    return true;
  }

  if (cfg.authType === "API_KEY") {
    const headerName = cfg.apiKeyHeaderName.toLowerCase();
    const received = req.headers[headerName];
    const candidate = Array.isArray(received) ? received[0] : received;
    return candidate === cfg.apiKeyValue;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return false;
  }

  const expected = `Bearer ${cfg.bearerToken}`;
  return authHeader === expected;
}

function captureRawBody(req: Request, _res: Response, buffer: Buffer): void {
  if (!buffer || buffer.length === 0) {
    return;
  }
  (req as RequestWithRawBody).rawBody = buffer.toString("utf8");
}

function isEmptyPlainObject(value: unknown): boolean {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0;
}

function getLogBody(req: RequestWithRawBody): unknown {
  if (typeof req.body === "string") {
    const textBody = req.body.trim();
    if (!textBody) {
      return req.body;
    }
    try {
      return JSON.parse(textBody);
    } catch (_error) {
      return textBody;
    }
  }

  if (!isEmptyPlainObject(req.body)) {
    return req.body;
  }

  const rawBody = typeof req.rawBody === "string" ? req.rawBody.trim() : "";
  if (!rawBody) {
    return req.body;
  }

  try {
    return JSON.parse(rawBody);
  } catch (_error) {
    return rawBody;
  }
}

function getRawRequestBody(req: RequestWithRawBody): string {
  if (typeof req.rawBody === "string") {
    return req.rawBody;
  }
  if (typeof req.body === "string") {
    return req.body;
  }
  if (req.body === undefined || req.body === null) {
    return "";
  }

  try {
    return JSON.stringify(req.body);
  } catch (_error) {
    return String(req.body);
  }
}

function normalizeHeaders(headers: HeaderMap): Array<[string, string]> {
  return Object.entries(headers)
    .filter(([key, value]) => value !== undefined && !blockedReplayHeaders.has(key.toLowerCase()))
    .map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value.join(",") : String(value)] as [string, string])
    .sort(([a], [b]) => a.localeCompare(b));
}

function buildReplaySignature(method: string, path: string, headers: HeaderMap, rawBody: string): string {
  return JSON.stringify({
    method: method.toUpperCase(),
    path,
    headers: normalizeHeaders(headers),
    rawBody
  });
}

function queueReplaySignature(signature: string): void {
  pendingReplaySignatures.set(signature, (pendingReplaySignatures.get(signature) ?? 0) + 1);
}

function consumeReplaySignature(signature: string): boolean {
  const current = pendingReplaySignatures.get(signature);
  if (!current) {
    return false;
  }
  if (current === 1) {
    pendingReplaySignatures.delete(signature);
    return true;
  }

  pendingReplaySignatures.set(signature, current - 1);
  return true;
}

function unqueueReplaySignature(signature: string): void {
  const current = pendingReplaySignatures.get(signature);
  if (!current) {
    return;
  }
  if (current === 1) {
    pendingReplaySignatures.delete(signature);
    return;
  }

  pendingReplaySignatures.set(signature, current - 1);
}

function canIncludeBody(method: string): boolean {
  const upperMethod = method.toUpperCase();
  return upperMethod !== "GET" && upperMethod !== "HEAD";
}

function buildReplayHeaders(headers: HeaderMap): Headers {
  const replayHeaders = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    if (value === undefined || blockedReplayHeaders.has(key.toLowerCase())) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => replayHeaders.append(key, String(entry)));
      return;
    }

    replayHeaders.append(key, String(value));
  });
  return replayHeaders;
}

function isTunnelForPort(tunnel: ngrok.Ngrok.Tunnel): boolean {
  const addr = String(tunnel.config?.addr || "").trim();
  return addr === String(PORT) || tunnelPortPattern.test(addr);
}

function choosePreferredTunnel(tunnels: ngrok.Ngrok.Tunnel[]): ngrok.Ngrok.Tunnel | null {
  if (tunnels.length === 0) {
    return null;
  }
  const httpsTunnel = tunnels.find((tunnel) => tunnel.proto === "https");
  return httpsTunnel || tunnels[0];
}

const existingTunnelPattern = /tunnel ["']?([^"']+)["']? already exists/i;

function pushErrorText(target: string[], value: unknown): void {
  if (typeof value === "string" && value.trim()) {
    target.push(value.trim());
  }
}

function collectNgrokErrorTexts(error: unknown): string[] {
  const parts: string[] = [];
  if (!error || typeof error !== "object") {
    pushErrorText(parts, error);
    return parts;
  }

  const err = error as {
    message?: unknown;
    body?: {
      msg?: unknown;
      details?: unknown;
    } | unknown;
  };

  pushErrorText(parts, err.message);
  pushErrorText(parts, err.body);

  if (err.body && typeof err.body === "object") {
    const body = err.body as { msg?: unknown; details?: unknown };
    pushErrorText(parts, body.msg);
    pushErrorText(parts, body.details);

    if (body.details && typeof body.details === "object") {
      Object.values(body.details as Record<string, unknown>).forEach((detailValue) => {
        pushErrorText(parts, detailValue);
      });
    }
  }

  return parts;
}

function uriMatchesTunnelName(uri: string | undefined, name: string): boolean {
  if (!uri) {
    return false;
  }
  return uri.endsWith(`/${name}`) || uri.endsWith(`/${encodeURIComponent(name)}`);
}

function extractExistingTunnelName(error: unknown): string | null {
  const texts = collectNgrokErrorTexts(error);
  for (const text of texts) {
    const match = text.match(existingTunnelPattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

async function listNgrokTunnels(): Promise<ngrok.Ngrok.Tunnel[]> {
  const api = ngrok.getApi();
  if (!api) {
    return [];
  }

  try {
    const response = await api.listTunnels();
    return Array.isArray(response?.tunnels) ? response.tunnels : [];
  } catch (_error) {
    return [];
  }
}

async function findExistingTunnelUrl(maybeError?: unknown): Promise<string | null> {
  const api = ngrok.getApi();
  const existingName = extractExistingTunnelName(maybeError);
  if (api && existingName) {
    try {
      const detail = await api.tunnelDetail(existingName);
      if (detail?.public_url) {
        return detail.public_url;
      }
    } catch (_error) {
      // Fall back to listing tunnels; tunnel detail is not always available.
    }
  }

  const tunnels = await listNgrokTunnels();
  if (tunnels.length === 0) {
    return null;
  }

  if (existingName) {
    const namedTunnel = tunnels.find((tunnel) => tunnel.name === existingName || uriMatchesTunnelName(tunnel.uri, existingName));
    if (namedTunnel?.public_url) {
      return namedTunnel.public_url;
    }
  }

  const matchingByPort = tunnels.filter(isTunnelForPort);
  const tunnel = choosePreferredTunnel(matchingByPort);
  if (tunnel?.public_url) {
    return tunnel.public_url;
  }

  if (existingName) {
    const fallback = choosePreferredTunnel(tunnels);
    return fallback?.public_url || null;
  }

  return null;
}

async function recoverExistingTunnelUrl(maybeError?: unknown): Promise<string | null> {
  const existingName = extractExistingTunnelName(maybeError);
  if (!existingName) {
    return findExistingTunnelUrl();
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const recovered = await findExistingTunnelUrl(maybeError);
    if (recovered) {
      return recovered;
    }
    await delay(125 * (attempt + 1));
  }

  return null;
}

function extractNgrokErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "unknown ngrok error";
  }

  const bodyMessage = (error as { body?: { msg?: unknown; details?: { err?: unknown } } }).body;
  const detailsErr = bodyMessage?.details?.err;
  if (typeof detailsErr === "string" && detailsErr.trim()) {
    return detailsErr;
  }
  if (typeof bodyMessage?.msg === "string" && bodyMessage.msg.trim()) {
    return bodyMessage.msg;
  }

  const directMessage = (error as { message?: unknown }).message;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }

  return "unknown ngrok error";
}

async function tryStartTunnel(authtoken: string): Promise<string> {
  return ngrok.connect({
    addr: PORT,
    ...(authtoken ? { authtoken } : {})
  });
}

async function clearConflictingTunnel(error: unknown): Promise<boolean> {
  const api = ngrok.getApi();
  if (!api) {
    return false;
  }

  const tunnels = await listNgrokTunnels();
  const namesToStop = new Set<string>();
  const existingName = extractExistingTunnelName(error);
  if (existingName) {
    namesToStop.add(existingName);
    tunnels
      .filter((tunnel) => tunnel.name === existingName || uriMatchesTunnelName(tunnel.uri, existingName))
      .forEach((tunnel) => namesToStop.add(tunnel.name));
  }

  tunnels.filter(isTunnelForPort).forEach((tunnel) => namesToStop.add(tunnel.name));

  let stoppedAny = false;
  for (const name of namesToStop) {
    try {
      const stopped = await api.stopTunnel(name);
      stoppedAny = stopped || stoppedAny;
    } catch (_stopError) {
      // Try the next candidate.
    }
  }
  if (stoppedAny) {
    return true;
  }

  try {
    await ngrok.disconnect();
    return true;
  } catch (_disconnectError) {
    return false;
  }
}

const app = express();
app.use("/api", express.json({ limit: "2mb", verify: captureRawBody }));
app.use("/api", express.urlencoded({ extended: true, limit: "2mb", verify: captureRawBody }));
app.use("/webhook/:endpoint", express.text({ type: () => true, limit: "2mb", verify: captureRawBody }));
app.use(express.static(path.resolve(__dirname, "../public")));

app.get("/health", (_req, res) => {
  const { endpointKeys } = store.getState();
  res.json({ status: "up", port: PORT, endpoints: endpointKeys });
});

app.get("/api/state", (_req, res) => {
  res.json(store.getState());
});

app.put("/api/config/:endpoint", (req: Request, res: Response) => {
  const endpoint = normalizeEndpointKey(req.params.endpoint);
  if (!endpoint) {
    res.status(404).json({ error: "Unknown endpoint" });
    return;
  }

  const update = req.body as Partial<EndpointConfig>;
  store.updateConfig(endpoint, update);
  res.json({ success: true, config: store.getState().configs[endpoint] });
});

app.post("/api/config/reset", (_req, res) => {
  store.resetConfigs();
  res.json({ success: true });
});

app.post("/api/profiles/save", (req: Request, res: Response) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "Profile name is required" });
    return;
  }

  const profile = store.saveProfile(name);
  res.json({ success: true, profile });
});

app.get("/api/profiles", (_req, res) => {
  res.json(store.getProfiles());
});

app.delete("/api/profiles/:id", (req: Request, res: Response) => {
  const deleted = store.deleteProfile(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({ success: true });
});

app.post("/api/profiles/:id/load", (req: Request, res: Response) => {
  const loaded = store.loadProfile(req.params.id);
  if (!loaded) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({ success: true });
});

app.get("/api/chaos", (_req, res) => {
  res.json(store.getChaos());
});

app.post("/api/chaos", (req: Request, res: Response) => {
  const enabled = req.body?.enabled;
  const failureRate = Number(req.body?.failureRate);
  if (typeof enabled !== "boolean" || !Number.isFinite(failureRate)) {
    res.status(400).json({ error: "Invalid chaos config" });
    return;
  }

  const normalizedFailureRate = Math.max(0, Math.min(100, Math.trunc(failureRate)));
  const chaosConfig = {
    enabled,
    failureRate: normalizedFailureRate
  };
  store.updateChaos(chaosConfig);
  res.json(chaosConfig);
});

app.post("/api/logs/clear", (_req, res) => {
  store.clearLogs();
  res.json({ success: true });
});

app.post("/api/logs/:id/replay", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid log id" });
    return;
  }

  const log = store.getState().logs.find((entry) => entry.id === id);
  if (!log) {
    res.status(404).json({ error: "Log entry not found" });
    return;
  }

  const replayMethod = (log.method || "POST").toUpperCase();
  const replayUrl = `http://127.0.0.1:${PORT}${log.path}`;
  const replayRawBody = typeof log.rawBody === "string" ? log.rawBody : "";
  const replaySignature = buildReplaySignature(replayMethod, log.path, log.headers, replayRawBody);
  queueReplaySignature(replaySignature);

  try {
    const replayResponse = await fetch(replayUrl, {
      method: replayMethod,
      headers: buildReplayHeaders(log.headers),
      body: canIncludeBody(replayMethod) ? replayRawBody : undefined
    });

    res.json({
      success: replayResponse.ok,
      status: replayResponse.status
    });
  } catch (_error) {
    unqueueReplaySignature(replaySignature);
    res.status(502).json({ error: "Replay request failed" });
  }
});

app.get("/api/tunnel/status", async (_req, res) => {
  const existingUrl = await findExistingTunnelUrl();
  if (existingUrl) {
    tunnelUrl = existingUrl;
  } else if (!tunnelUrl) {
    tunnelUrl = null;
  }

  res.json({
    active: Boolean(tunnelUrl),
    url: tunnelUrl
  });
});

app.post("/api/tunnel/start", async (_req, res) => {
  if (tunnelUrl) {
    res.json({ active: true, url: tunnelUrl });
    return;
  }

  const existingUrl = await findExistingTunnelUrl();
  if (existingUrl) {
    tunnelUrl = existingUrl;
    res.json({ active: true, url: tunnelUrl });
    return;
  }

  const rawToken = process.env.NGROK_AUTHTOKEN;
  const authtoken = typeof rawToken === "string" ? rawToken.trim() : "";
  let startError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      tunnelUrl = await tryStartTunnel(authtoken);
      res.json({ active: true, url: tunnelUrl });
      return;
    } catch (error) {
      startError = error;
      const recoveredUrl = await recoverExistingTunnelUrl(error);
      if (recoveredUrl) {
        tunnelUrl = recoveredUrl;
        res.json({ active: true, url: tunnelUrl });
        return;
      }

      const cleared = await clearConflictingTunnel(error);
      if (!cleared) {
        break;
      }
    }
  }

  let finalError: unknown = startError;
  for (let restartAttempt = 0; restartAttempt < 3; restartAttempt += 1) {
    try {
      await ngrok.disconnect();
    } catch (_disconnectError) {
      // Continue to kill/start; disconnect can fail if no tunnel exists.
    }

    try {
      await ngrok.kill();
      await delay(200 * (restartAttempt + 1));
      tunnelUrl = await tryStartTunnel(authtoken);
      res.json({ active: true, url: tunnelUrl });
      return;
    } catch (restartError) {
      finalError = restartError;
      const recoveredAfterRestart = await recoverExistingTunnelUrl(restartError);
      if (recoveredAfterRestart) {
        tunnelUrl = recoveredAfterRestart;
        res.json({ active: true, url: tunnelUrl });
        return;
      }

      if (!extractExistingTunnelName(restartError)) {
        break;
      }
    }
  }

  tunnelUrl = null;
  res.status(500).json({
    active: false,
    url: null,
    error: "Failed to start tunnel",
    details: extractNgrokErrorMessage(finalError ?? startError)
  });
});

app.post("/api/tunnel/stop", async (_req, res) => {
  try {
    if (tunnelUrl) {
      await ngrok.disconnect(tunnelUrl);
    } else {
      await ngrok.disconnect();
    }
    await ngrok.kill();
  } catch (_error) {
    tunnelUrl = null;
    res.status(500).json({ active: false, url: null, error: "Failed to stop tunnel" });
    return;
  }

  tunnelUrl = null;
  res.json({ active: false, url: null });
});

app.post("/webhook/:endpoint", async (req: Request, res: Response) => {
  const request = req as RequestWithRawBody;
  const endpoint = normalizeEndpointKey(req.params.endpoint);
  if (!endpoint) {
    res.status(404).json({ error: "Unknown webhook endpoint" });
    return;
  }

  const { configs } = store.getState();
  const cfg = configs[endpoint];
  const rawBody = getRawRequestBody(request);
  const replayed = consumeReplaySignature(buildReplaySignature(req.method, req.originalUrl, req.headers, rawBody));
  const chaosConfig = store.getChaos();
  if (chaosConfig.enabled && Math.random() * 100 < chaosConfig.failureRate) {
    store.addLog({
      endpoint,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      headers: req.headers,
      body: getLogBody(request),
      rawBody,
      authValid: true,
      returnedStatusCode: 503,
      note: "chaos injection",
      replayed
    });

    res.status(503).json({
      error: "chaos",
      message: "Chaos mode injected this failure"
    });
    return;
  }

  const authValid = validateAuth(req, cfg);
  if (!authValid) {
    store.addLog({
      endpoint,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      headers: req.headers,
      body: getLogBody(request),
      rawBody,
      authValid: false,
      returnedStatusCode: 401,
      note: "Auth failed",
      replayed
    });

    res.status(401).json({ status: "unauthorized", endpoint });
    return;
  }

  const statusCode = store.getNextStatusCode(endpoint);
  await delay(cfg.responseDelayMs);

  let responsePayload: unknown = cfg.responseBody;
  try {
    responsePayload = JSON.parse(cfg.responseBody);
  } catch (_error) {
    responsePayload = { raw: cfg.responseBody };
  }

  store.addLog({
    endpoint,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    headers: req.headers,
    body: getLogBody(request),
    rawBody,
    authValid: true,
    returnedStatusCode: statusCode,
    note: cfg.statusCodes && cfg.statusCodes.length > 0 ? "Sequence status code used" : "Configured status code used",
    replayed
  });

  if (cfg.responseHeaders) {
    Object.entries(cfg.responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  res.status(statusCode).json(responsePayload);
});

app.listen(PORT, () => {
  console.log(`Webhook Mock Lab started on http://localhost:${PORT}`);
  console.log("Endpoints:");
  const { endpointKeys } = store.getState();
  endpointKeys.forEach((key) => {
    console.log(`  POST /webhook/${key}`);
  });
});

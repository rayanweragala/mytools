import express, { Request, Response } from "express";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import * as ngrok from "ngrok";
import {
  ANALYSIS_SYSTEM_PROMPT,
  CURL_TO_REQUEST_SYSTEM_PROMPT,
  DEBUG_SYSTEM_PROMPT,
  PAYLOAD_SYSTEM_PROMPT,
  REQUEST_TO_CURL_SYSTEM_PROMPT,
  buildPrompt,
  cleanAiJson,
  cleanAiText,
  generate,
  getAiFeatures
} from "./ai.js";
import { executeBuilderSend, payloadFromSaved } from "./builderHttp.js";
import { collectionsStore } from "./collectionsStore.js";
import { environmentsStore } from "./environmentsStore.js";
import { logError, logStartup } from "./log.js";
import { store } from "./store.js";
import type {
  BodyFormat,
  BuilderAuthPayload,
  BuilderSendPayload,
  EndpointConfig,
  EndpointKey,
  KeyValueEnabled,
  SavedRequest
} from "./types.js";

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

const builderSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "rate limit", retryAfter: 60 });
  }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "rate limit", retryAfter: 60 });
  }
});

interface BuilderHistoryEntry {
  id: string;
  at: string;
  method: string;
  url: string;
  headers: KeyValueEnabled[];
  bodyFormat: BodyFormat;
  bodyText: string;
  formFields: KeyValueEnabled[];
  params: KeyValueEnabled[];
  auth: BuilderAuthPayload;
  status: number;
  durationMs: number;
}

interface AiCurlRequestShape {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  params: Record<string, string>;
}

interface AiGeneratedTestCaseShape extends AiCurlRequestShape {
  name: string;
}

interface AiChatTurn {
  role: "user" | "assistant";
  content: string;
}

const TEST_CASES_SYSTEM_PROMPT =
  "You are an API testing assistant. Given an HTTP request, generate " +
  "exactly 6 test case variations as a JSON array. Each variation tests " +
  "a different edge case: missing required field, wrong data type, " +
  "empty body, boundary value, invalid auth, unexpected extra field. " +
  "Return only a JSON array of objects, each with: " +
  "{ name: string, method, url, headers, body, params } " +
  "No explanation. No markdown. Just the raw JSON array.";

const CHAT_SYSTEM_PROMPT =
  "You are a helpful assistant inside a developer API tool called mytools. " +
  "You have access to the user's current app state shown below. " +
  "Answer questions about their requests, collections, logs, and endpoints. " +
  "Be brief and direct. If you don't know something, say so. " +
  "Never make up endpoint paths or request data that isn't in the context.";

const chatSessions = new Map<string, AiChatTurn[]>();

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    out[key] = typeof entry === "string" ? entry : String(entry ?? "");
  }
  return out;
}

function normalizeAiCurlRequest(value: unknown): AiCurlRequestShape | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const method = typeof record.method === "string" ? record.method.trim().toUpperCase() : "";
  const url = typeof record.url === "string" ? record.url.trim() : "";
  if (!method || !url) {
    return null;
  }
  return {
    method,
    url,
    headers: toStringRecord(record.headers),
    body: typeof record.body === "string" ? record.body : record.body == null ? "" : JSON.stringify(record.body),
    params: toStringRecord(record.params)
  };
}

function normalizeAiGeneratedTestCase(value: unknown): AiGeneratedTestCaseShape | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const normalizedRequest = normalizeAiCurlRequest(value);
  if (!name || !normalizedRequest) {
    return null;
  }
  return {
    name,
    ...normalizedRequest
  };
}

function guessBodyFormat(body: string): BodyFormat {
  const trimmed = body.trim();
  if (!trimmed) {
    return "json";
  }
  try {
    JSON.parse(trimmed);
    return "json";
  } catch {
    return "text";
  }
}

function aiGeneratedCaseToSavedRequest(testCase: AiGeneratedTestCaseShape): Omit<SavedRequest, "id"> {
  return {
    name: testCase.name,
    method: testCase.method,
    url: mergeUrlAndParams(testCase.url, testCase.params),
    headers: buildRowsFromRecord(testCase.headers),
    bodyFormat: guessBodyFormat(testCase.body),
    bodyText: testCase.body,
    formFields: [{ key: "", value: "", enabled: true }],
    params: buildRowsFromRecord(testCase.params),
    auth: { type: "NONE" }
  };
}

function buildRowsFromRecord(record: Record<string, string>): KeyValueEnabled[] {
  const rows = Object.entries(record).map(([key, value]) => ({ key, value, enabled: true }));
  return rows.length ? rows : [{ key: "", value: "", enabled: true }];
}

function mergeUrlAndParams(url: string, params: Record<string, string>): string {
  try {
    const target = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      target.searchParams.set(key, value);
    });
    return target.toString();
  } catch {
    return url;
  }
}

function aiRequestToBuilderSnapshot(request: AiCurlRequestShape) {
  return {
    method: request.method,
    url: mergeUrlAndParams(request.url, request.params),
    headers: buildRowsFromRecord(request.headers),
    bodyFormat: "json",
    bodyText: request.body,
    formFields: [{ key: "", value: "", enabled: true }],
    params: buildRowsFromRecord(request.params),
    auth: { type: "NONE" }
  };
}

function builderPayloadToAiCurlRequest(payload: BuilderSendPayload): AiCurlRequestShape {
  const headers: Record<string, string> = {};
  const params: Record<string, string> = {};

  for (const row of Array.isArray(payload.headers) ? payload.headers : []) {
    if (row.enabled === false) {
      continue;
    }
    const key = String(row.key || "").trim();
    if (!key) {
      continue;
    }
    headers[key] = String(row.value ?? "");
  }

  for (const row of Array.isArray(payload.params) ? payload.params : []) {
    if (row.enabled === false) {
      continue;
    }
    const key = String(row.key || "").trim();
    if (!key) {
      continue;
    }
    params[key] = String(row.value ?? "");
  }

  return {
    method: String(payload.method || "GET").toUpperCase(),
    url: String(payload.url || "").trim(),
    headers,
    body: typeof payload.body === "string" ? payload.body : "",
    params
  };
}

function buildCurlToRequestPrompt(curl: string): string {
  return buildPrompt(CURL_TO_REQUEST_SYSTEM_PROMPT, curl);
}

function buildRequestToCurlPrompt(request: AiCurlRequestShape): string {
  return buildPrompt(REQUEST_TO_CURL_SYSTEM_PROMPT, JSON.stringify(request, null, 2));
}

const builderHistory: BuilderHistoryEntry[] = [];
const MAX_BUILDER_HISTORY = 200;

function pushBuilderHistory(entry: Omit<BuilderHistoryEntry, "id" | "at">): BuilderHistoryEntry {
  const full: BuilderHistoryEntry = {
    ...entry,
    id: `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString()
  };
  builderHistory.unshift(full);
  if (builderHistory.length > MAX_BUILDER_HISTORY) {
    builderHistory.length = MAX_BUILDER_HISTORY;
  }
  return full;
}

function ngrokConfigured(): boolean {
  const raw = process.env.NGROK_AUTHTOKEN;
  return typeof raw === "string" && raw.trim().length > 0;
}

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

function normalizeForwardUrl(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function forwardWebhookRequest(
  logId: number,
  forwardUrl: string,
  method: string,
  headers: HeaderMap,
  rawBody: string
): Promise<void> {
  try {
    const response = await fetch(forwardUrl, {
      method,
      headers: buildReplayHeaders(headers),
      body: canIncludeBody(method) ? rawBody : undefined
    });
    store.updateLogForwardResult(logId, response.status, null);
  } catch (error) {
    const message = error instanceof Error ? error.message : "forward request failed";
    store.updateLogForwardResult(logId, null, message);
  }
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

const sseClients = new Set<Response>();
let lastSseSnapshot = "";

function buildSseSnapshot() {
  return {
    state: store.getState(),
    tunnel: { active: Boolean(tunnelUrl), url: tunnelUrl },
    chaos: store.getChaos()
  };
}

function writeSseData(res: Response, payload: unknown): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastSseSnapshot(force = false): void {
  if (sseClients.size === 0) {
    return;
  }
  const snapshot = buildSseSnapshot();
  const encoded = JSON.stringify(snapshot);
  if (!force && encoded === lastSseSnapshot) {
    return;
  }
  lastSseSnapshot = encoded;
  for (const client of sseClients) {
    client.write(`data: ${encoded}\n\n`);
  }
}

setInterval(() => {
  broadcastSseSnapshot();
}, 1000);

setInterval(() => {
  if (sseClients.size === 0) {
    return;
  }
  for (const client of sseClients) {
    client.write(": keep-alive\n\n");
  }
}, 25000);

app.get("/health", (_req, res) => {
  const { endpointKeys } = store.getState();
  res.json({ status: "up", port: PORT, endpoints: endpointKeys });
});

app.get("/api/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write("retry: 3000\n\n");
  writeSseData(res, buildSseSnapshot());
  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

app.get("/api/state", (_req, res) => {
  res.json(store.getState());
});

app.get("/api/config/features", (_req, res) => {
  const ai = getAiFeatures();
  res.json({
    aiEnabled: ai.aiEnabled,
    localAiEnabled: ai.localAiEnabled,
    geminiEnabled: ai.geminiEnabled,
    ngrokEnabled: ngrokConfigured()
  });
});

app.get("/api/builder/history", (_req, res) => {
  res.json({ history: builderHistory });
});

app.post("/api/builder/history/clear", (_req, res) => {
  builderHistory.length = 0;
  res.json({ success: true });
});

app.post("/api/builder/send", builderSendLimiter, async (req: Request, res: Response) => {
  const payload = req.body as BuilderSendPayload;
  if (!payload || typeof payload.url !== "string" || !payload.url.trim()) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  try {
    const envMap = environmentsStore.getActiveSubstitutionMap();
    const result = await executeBuilderSend(payload, envMap);
    const authPayload: BuilderAuthPayload = payload.auth?.type ? payload.auth : { type: "NONE" };
    pushBuilderHistory({
      method: String(payload.method || "GET"),
      url: String(payload.url),
      headers: Array.isArray(payload.headers) ? payload.headers : [],
      bodyFormat: (payload.bodyFormat as BodyFormat) || "json",
      bodyText: typeof payload.body === "string" ? payload.body : "",
      formFields: Array.isArray(payload.formFields) ? payload.formFields : [],
      params: Array.isArray(payload.params) ? payload.params : [],
      auth: authPayload,
      status: result.status,
      durationMs: result.duration_ms
    });
    res.json({
      status: result.status,
      statusText: result.statusText,
      headers: result.headers,
      body: result.body,
      duration_ms: result.duration_ms,
      size_bytes: result.size_bytes,
      warnings: result.warnings
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    logError("builder send failed", error);
    res.status(502).json({ error: message });
  }
});

app.get("/api/collections", (_req, res) => {
  res.json({ collections: collectionsStore.getAll() });
});

app.post("/api/collections", (req: Request, res: Response) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const created = collectionsStore.create(name);
  res.json(created);
});

app.delete("/api/collections/:id", (req: Request, res: Response) => {
  const ok = collectionsStore.delete(req.params.id);
  if (!ok) {
    res.status(404).json({ error: "collection not found" });
    return;
  }
  res.json({ success: true });
});

app.post("/api/collections/import", (req: Request, res: Response) => {
  const body = req.body as { name?: string; requests?: unknown };
  const name = typeof body?.name === "string" ? body.name.trim() : "Imported";
  const requests = Array.isArray(body?.requests) ? body.requests : [];
  const created = collectionsStore.importCollection({ name, requests: requests as Omit<SavedRequest, "id">[] });
  res.json(created);
});

app.post("/api/collections/:id/requests", (req: Request, res: Response) => {
  const collectionId = req.params.id;
  const b = req.body as Partial<SavedRequest>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const saved = collectionsStore.addRequest(collectionId, {
    name,
    method: typeof b.method === "string" ? b.method : "GET",
    url: typeof b.url === "string" ? b.url : "",
    headers: Array.isArray(b.headers) ? b.headers : [],
    bodyFormat: b.bodyFormat === "text" || b.bodyFormat === "form" ? b.bodyFormat : "json",
    bodyText: typeof b.bodyText === "string" ? b.bodyText : "",
    formFields: Array.isArray(b.formFields) ? b.formFields : [],
    params: Array.isArray(b.params) ? b.params : [],
    auth: b.auth?.type ? b.auth : { type: "NONE" }
  });

  if (!saved) {
    res.status(404).json({ error: "collection not found" });
    return;
  }

  res.json(saved);
});

app.put("/api/collections/:id/requests/:reqId", (req: Request, res: Response) => {
  const b = req.body as Partial<SavedRequest>;
  const updated = collectionsStore.updateRequest(req.params.id, req.params.reqId, {
    ...(typeof b.name === "string" ? { name: b.name } : {}),
    ...(typeof b.method === "string" ? { method: b.method } : {}),
    ...(typeof b.url === "string" ? { url: b.url } : {}),
    ...(Array.isArray(b.headers) ? { headers: b.headers } : {}),
    ...(b.bodyFormat === "json" || b.bodyFormat === "text" || b.bodyFormat === "form" ? { bodyFormat: b.bodyFormat } : {}),
    ...(typeof b.bodyText === "string" ? { bodyText: b.bodyText } : {}),
    ...(Array.isArray(b.formFields) ? { formFields: b.formFields } : {}),
    ...(Array.isArray(b.params) ? { params: b.params } : {}),
    ...(b.auth?.type ? { auth: b.auth } : {})
  });

  if (!updated) {
    res.status(404).json({ error: "collection or request not found" });
    return;
  }

  res.json(updated);
});

app.delete("/api/collections/:id/requests/:reqId", (req: Request, res: Response) => {
  const ok = collectionsStore.deleteRequest(req.params.id, req.params.reqId);
  if (!ok) {
    res.status(404).json({ error: "collection or request not found" });
    return;
  }
  res.json({ success: true });
});

app.post("/api/collections/:id/requests/:reqId/run", builderSendLimiter, async (req: Request, res: Response) => {
  const col = collectionsStore.getById(req.params.id);
  if (!col) {
    res.status(404).json({ error: "collection not found" });
    return;
  }

  const saved = col.requests.find((r) => r.id === req.params.reqId);
  if (!saved) {
    res.status(404).json({ error: "request not found" });
    return;
  }

  const payload = payloadFromSaved(saved);

  try {
    const envMap = environmentsStore.getActiveSubstitutionMap();
    const result = await executeBuilderSend(payload, envMap);
    res.json({
      status: result.status,
      statusText: result.statusText,
      headers: result.headers,
      body: result.body,
      duration_ms: result.duration_ms,
      size_bytes: result.size_bytes,
      warnings: result.warnings
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    logError("collection run failed", error);
    res.status(502).json({ error: message });
  }
});

app.get("/api/environments", (_req, res) => {
  res.json(environmentsStore.listForApi());
});

app.get("/api/environments/:id", (req: Request, res: Response) => {
  const env = environmentsStore.getByIdForApi(req.params.id);
  if (!env) {
    res.status(404).json({ error: "environment not found" });
    return;
  }
  res.json(env);
});

app.post("/api/environments", (req: Request, res: Response) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const created = environmentsStore.create(name);
  res.json(created);
});

app.delete("/api/environments/:id", (req: Request, res: Response) => {
  const ok = environmentsStore.delete(req.params.id);
  if (!ok) {
    res.status(404).json({ error: "environment not found" });
    return;
  }
  res.json({ success: true });
});

app.put("/api/environments/:id/variables", (req: Request, res: Response) => {
  const rows = (req.body as { variables?: unknown }).variables;
  if (!Array.isArray(rows)) {
    res.status(400).json({ error: "variables array is required" });
    return;
  }

  const normalized = rows.map((row: { key?: unknown; value?: unknown; secret?: unknown }) => ({
    key: typeof row.key === "string" ? row.key : "",
    value: typeof row.value === "string" ? row.value : "",
    secret: Boolean(row.secret)
  }));

  const updated = environmentsStore.replaceVariables(req.params.id, normalized);
  if (!updated) {
    res.status(404).json({ error: "environment not found" });
    return;
  }

  res.json(environmentsStore.getByIdForApi(updated.id));
});

app.post("/api/environments/active", (req: Request, res: Response) => {
  const id = (req.body as { id?: string | null }).id;
  if (id !== null && id !== undefined && typeof id !== "string") {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const nextId = id === undefined ? null : id;
  environmentsStore.setActive(nextId);
  res.json({ success: true, activeEnvironmentId: environmentsStore.listForApi().activeEnvironmentId });
});

function asDebugObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function normalizeChatHistory(value: unknown): AiChatTurn[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }
      const roleRaw = (entry as { role?: unknown }).role;
      const contentRaw = (entry as { content?: unknown }).content;
      const role = roleRaw === "user" || roleRaw === "assistant" ? roleRaw : null;
      const content = typeof contentRaw === "string" ? contentRaw.trim() : "";
      if (!role || !content) {
        return null;
      }
      return { role, content } as AiChatTurn;
    })
    .filter((entry): entry is AiChatTurn => Boolean(entry))
    .slice(-20);
}

app.post("/api/ai/generate", aiLimiter, async (req: Request, res: Response) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  const context = typeof req.body?.context === "string" ? req.body.context : undefined;
  if (!prompt.trim()) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  const userText = context ? `${prompt}\n\nContext: ${context}` : prompt;
  const fullPrompt = `${PAYLOAD_SYSTEM_PROMPT}\n\n${userText}`;

  try {
    const result = await generate(fullPrompt);
    res.json({ result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generation failed";
    res.json({ result: "", error: msg });
  }
});

app.post("/api/ai/analyze-log", aiLimiter, async (req: Request, res: Response) => {
  const logId = Number((req.body as { logId?: unknown }).logId);
  if (!Number.isInteger(logId) || logId <= 0) {
    res.status(400).json({ error: "invalid logId" });
    return;
  }

  const entry = store.getLogById(logId);
  if (!entry) {
    res.status(404).json({ error: "log not found" });
    return;
  }

  const requestSummary = [
    `method: ${entry.method}`,
    `path: ${entry.path}`,
    `endpoint: ${entry.endpoint}`,
    `authValid: ${entry.authValid}`,
    `headers: ${JSON.stringify(entry.headers)}`,
    `body: ${typeof entry.rawBody === "string" ? entry.rawBody : JSON.stringify(entry.body)}`
  ].join("\n");

  const responseSummary = [
    `status: ${entry.returnedStatusCode}`,
    `note: ${entry.note}`,
    `durationMs: ${entry.durationMs ?? "n/a"}`
  ].join("\n");

  const analyticPrompt = `${ANALYSIS_SYSTEM_PROMPT}\n\nRequest:\n${requestSummary}\n\nResponse:\n${responseSummary}`;

  try {
    const result = await generate(analyticPrompt);
    res.json({ result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "analysis failed";
    res.json({ result: "", error: msg });
  }
});

app.post("/api/ai/debug", aiLimiter, async (req: Request, res: Response) => {
  const requestObject = asDebugObject((req.body as { request?: unknown })?.request);
  const responseObject = asDebugObject((req.body as { response?: unknown })?.response);
  if (!requestObject || !responseObject) {
    res.status(400).json({ success: false, error: "request and response objects are required" });
    return;
  }

  const debugPrompt = buildPrompt(
    DEBUG_SYSTEM_PROMPT,
    `Request:\n${JSON.stringify(requestObject, null, 2)}`,
    `Response:\n${JSON.stringify(responseObject, null, 2)}`
  );

  try {
    const analysis = cleanAiText(await generate(debugPrompt));
    res.json({ success: true, analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "debug analysis failed";
    res.status(502).json({ success: false, error: message });
  }
});

app.post("/api/ai/chat", aiLimiter, async (req: Request, res: Response) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }

  const sessionIdRaw = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";
  const sessionId = sessionIdRaw || `chat_${randomUUID()}`;
  const history = normalizeChatHistory((req.body as { history?: unknown }).history);
  const context = asDebugObject((req.body as { context?: unknown }).context) || {};

  const baseHistory: AiChatTurn[] = history.length > 0 ? history : chatSessions.get(sessionId) ?? [];
  const historyLines = baseHistory.map((turn) => `${turn.role === "assistant" ? "Assistant" : "User"}: ${turn.content}`).join("\n\n");
  const chatPrompt = buildPrompt(
    CHAT_SYSTEM_PROMPT,
    `Context JSON:\n${JSON.stringify(context, null, 2)}`,
    historyLines ? `Conversation History:\n${historyLines}` : undefined,
    `User: ${message}`
  );

  try {
    const reply = cleanAiText(await generate(chatPrompt));
    const userTurn: AiChatTurn = { role: "user", content: message };
    const assistantTurn: AiChatTurn = { role: "assistant", content: reply };
    const nextHistory: AiChatTurn[] = [...baseHistory, userTurn, assistantTurn].slice(-20);
    chatSessions.set(sessionId, nextHistory);
    res.json({ success: true, reply, sessionId });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "chat failed";
    res.status(502).json({ success: false, error: messageText });
  }
});

app.post("/api/ai/curl-to-request", aiLimiter, async (req: Request, res: Response) => {
  const curl = typeof req.body?.curl === "string" ? req.body.curl.trim() : "";
  if (!curl) {
    res.status(400).json({ success: false, error: "curl is required" });
    return;
  }

  try {
    const result = await generate(buildCurlToRequestPrompt(curl));
    const parsed = cleanAiJson<unknown>(result);
    const request = normalizeAiCurlRequest(parsed);
    if (!request) {
      res.json({ success: false, error: "Could not parse curl command" });
      return;
    }
    res.json({ success: true, request });
  } catch (_error) {
    res.json({ success: false, error: "Could not parse curl command" });
  }
});

app.post("/api/ai/request-to-curl", aiLimiter, async (req: Request, res: Response) => {
  const request = normalizeAiCurlRequest(req.body) || builderPayloadToAiCurlRequest(req.body as BuilderSendPayload);
  if (!request.url) {
    res.status(400).json({ success: false, error: "url is required" });
    return;
  }

  try {
    const result = await generate(buildRequestToCurlPrompt(request));
    res.json({ success: true, curl: cleanAiText(result) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "curl generation failed";
    res.status(502).json({ success: false, error: message });
  }
});

app.post("/api/ai/generate-tests", aiLimiter, async (req: Request, res: Response) => {
  const request = normalizeAiGeneratedTestCase((req.body as { request?: unknown })?.request);
  if (!request) {
    res.status(400).json({ success: false, error: "request payload is required" });
    return;
  }

  const prompt = buildPrompt(TEST_CASES_SYSTEM_PROMPT, JSON.stringify(request, null, 2));

  try {
    const result = await generate(prompt);
    const parsed = cleanAiJson<unknown>(result);
    const array = Array.isArray(parsed) ? parsed : [];
    const tests = array
      .map((item: unknown) => normalizeAiGeneratedTestCase(item))
      .filter((item: AiGeneratedTestCaseShape | null): item is AiGeneratedTestCaseShape => Boolean(item));

    if (tests.length < 1) {
      res.json({ success: false, error: "Could not parse generated tests" });
      return;
    }

    res.json({ success: true, tests });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate tests";
    res.status(502).json({ success: false, error: message });
  }
});

app.post("/api/ai/generate-tests/save", (req: Request, res: Response) => {
  const collectionId = typeof req.body?.collectionId === "string" ? req.body.collectionId : "";
  const sourceRequestName = typeof req.body?.sourceRequestName === "string" ? req.body.sourceRequestName.trim() : "";
  const tests = Array.isArray(req.body?.tests) ? req.body.tests : [];
  if (!collectionId || tests.length === 0) {
    res.status(400).json({ success: false, error: "collectionId and tests are required" });
    return;
  }

  const normalized = tests
    .map((item: unknown) => normalizeAiGeneratedTestCase(item))
    .filter((item: AiGeneratedTestCaseShape | null): item is AiGeneratedTestCaseShape => Boolean(item));
  if (normalized.length < 1) {
    res.status(400).json({ success: false, error: "No valid tests to save" });
    return;
  }

  let targetCollectionId = collectionId;
  let collectionName = "";
  if (collectionId === "new") {
    const seed = sourceRequestName || normalized[0].name || "Generated";
    const created = collectionsStore.create(`${seed} Tests`);
    targetCollectionId = created.id;
    collectionName = created.name;
  } else {
    const existing = collectionsStore.getById(collectionId);
    if (!existing) {
      res.status(404).json({ success: false, error: "collection not found" });
      return;
    }
    collectionName = existing.name;
  }

  let saved = 0;
  for (const testCase of normalized) {
    const inserted = collectionsStore.addRequest(targetCollectionId, aiGeneratedCaseToSavedRequest(testCase));
    if (inserted) {
      saved += 1;
    }
  }

  res.json({
    success: true,
    saved,
    collectionId: targetCollectionId,
    collectionName
  });
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

  const t0 = Date.now();
  const { configs } = store.getState();
  const cfg = configs[endpoint];
  const rawBody = getRawRequestBody(request);
  const replayed = consumeReplaySignature(buildReplaySignature(req.method, req.originalUrl, req.headers, rawBody));
  const forwardUrl = normalizeForwardUrl(cfg.forwardUrl);
  const maybeForward = (logId: number): void => {
    if (!forwardUrl) {
      return;
    }
    void forwardWebhookRequest(logId, forwardUrl, req.method, req.headers, rawBody);
  };
  const chaosConfig = store.getChaos();
  if (chaosConfig.enabled && Math.random() * 100 < chaosConfig.failureRate) {
    const logId = store.addLog({
      endpoint,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      headers: req.headers,
      body: getLogBody(request),
      rawBody,
      authValid: true,
      returnedStatusCode: 503,
      forwardStatus: null,
      forwardError: null,
      note: "chaos injection",
      replayed,
      responseHeaders: { "Content-Type": "application/json" },
      responseBody: {
        error: "chaos",
        message: "Chaos mode injected this failure"
      },
      durationMs: Date.now() - t0
    });
    maybeForward(logId);

    res.status(503).json({
      error: "chaos",
      message: "Chaos mode injected this failure"
    });
    return;
  }

  const authValid = validateAuth(req, cfg);
  if (!authValid) {
    const logId = store.addLog({
      endpoint,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      headers: req.headers,
      body: getLogBody(request),
      rawBody,
      authValid: false,
      returnedStatusCode: 401,
      forwardStatus: null,
      forwardError: null,
      note: "Auth failed",
      replayed,
      responseHeaders: { "Content-Type": "application/json" },
      responseBody: { status: "unauthorized", endpoint },
      durationMs: Date.now() - t0
    });
    maybeForward(logId);

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

  const logId = store.addLog({
    endpoint,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    headers: req.headers,
    body: getLogBody(request),
    rawBody,
    authValid: true,
    returnedStatusCode: statusCode,
    forwardStatus: null,
    forwardError: null,
    note: cfg.statusCodes && cfg.statusCodes.length > 0 ? "Sequence status code used" : "Configured status code used",
    replayed,
    responseHeaders: cfg.responseHeaders || {},
    responseBody: responsePayload,
    durationMs: Date.now() - t0
  });
  maybeForward(logId);

  if (cfg.responseHeaders) {
    Object.entries(cfg.responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  res.status(statusCode).json(responsePayload);
});

app.listen(PORT, () => {
  logStartup(`Webhook Mock Lab started on http://localhost:${PORT}`);
  const aiFeatures = getAiFeatures();
  if (aiFeatures.localAiEnabled) {
    logStartup("AI: Local provider enabled");
  } else if (aiFeatures.geminiEnabled) {
    logStartup("AI: Gemini enabled");
  } else {
    logStartup("AI: No provider configured — AI features disabled");
  }
  logStartup("Endpoints:");
  const { endpointKeys } = store.getState();
  endpointKeys.forEach((key) => {
    logStartup(`  POST /webhook/${key}`);
  });
});

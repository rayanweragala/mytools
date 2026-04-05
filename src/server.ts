import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { store } from "./store.js";
import { EndpointConfig, EndpointKey, RequestLog } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8787);

type RequestWithRawBody = Request & { rawBody?: string };

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

app.post("/api/logs/clear", (_req, res) => {
  store.clearLogs();
  res.json({ success: true });
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
  const authValid = validateAuth(req, cfg);

  if (!authValid) {
    store.addLog({
      endpoint,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      headers: req.headers,
      body: getLogBody(request),
      authValid: false,
      returnedStatusCode: 401,
      note: "Auth failed"
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
    authValid: true,
    returnedStatusCode: statusCode,
    note: cfg.statusCodes && cfg.statusCodes.length > 0 ? "Sequence status code used" : "Configured status code used"
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

import type { BodyFormat, BuilderAuthPayload, BuilderSendPayload, KeyValueEnabled } from "./types.js";
import { substituteAll } from "./envSubstitution.js";

function enabledRows(rows: KeyValueEnabled[]): Array<{ key: string; value: string }> {
  return rows
    .filter((r) => r.enabled !== false && String(r.key || "").trim())
    .map((r) => ({ key: String(r.key).trim(), value: String(r.value ?? "") }));
}

function buildBody(payload: BuilderSendPayload): { body: string; contentType: string | null } {
  const fmt: BodyFormat = payload.bodyFormat || "json";
  if (fmt === "form") {
    const rows = enabledRows(payload.formFields || []);
    const params = new URLSearchParams();
    rows.forEach((r) => params.append(r.key, r.value));
    return { body: params.toString(), contentType: "application/x-www-form-urlencoded" };
  }
  const raw = typeof payload.body === "string" ? payload.body : "";
  if (fmt === "text") {
    return { body: raw, contentType: "text/plain; charset=utf-8" };
  }
  return { body: raw, contentType: "application/json; charset=utf-8" };
}

function applyAuth(headers: Record<string, string>, auth: BuilderAuthPayload | undefined): void {
  if (!auth || auth.type === "NONE") {
    return;
  }
  if (auth.type === "BEARER") {
    const token = String(auth.bearerToken || "").trim();
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    return;
  }
  if (auth.type === "API_KEY") {
    const name = String(auth.apiKeyHeader || "").trim();
    const val = String(auth.apiKeyValue || "");
    if (name) {
      headers[name] = val;
    }
    return;
  }
  if (auth.type === "BASIC") {
    const u = String(auth.basicUser || "");
    const p = String(auth.basicPassword || "");
    const b64 = Buffer.from(`${u}:${p}`, "utf8").toString("base64");
    headers.authorization = `Basic ${b64}`;
  }
}

function mergeUrlWithParams(urlStr: string, params: KeyValueEnabled[]): string {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    return urlStr;
  }
  const sp = new URLSearchParams();
  enabledRows(params).forEach((r) => sp.append(r.key, r.value));
  u.search = sp.toString();
  return u.toString();
}

export interface ExecuteResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration_ms: number;
  size_bytes: number;
  warnings: string[];
}

export async function executeBuilderSend(
  payload: BuilderSendPayload,
  envMap: Record<string, string>
): Promise<ExecuteResult> {
  const headerMap: Record<string, string> = {};
  for (const row of payload.headers || []) {
    if (row.enabled === false) {
      continue;
    }
    const k = String(row.key || "").trim();
    if (!k) {
      continue;
    }
    headerMap[k] = String(row.value ?? "");
  }

  applyAuth(headerMap, payload.auth);

  const paramRecord: Record<string, string> = {};
  for (const row of enabledRows(payload.params)) {
    paramRecord[row.key] = row.value;
  }

  const mergedUrl = mergeUrlWithParams(String(payload.url || "").trim(), payload.params || []);

  const { body: rawBody, contentType } = buildBody(payload);
  if (contentType) {
    const hasCT = Object.keys(headerMap).some((k) => k.toLowerCase() === "content-type");
    if (!hasCT) {
      headerMap["Content-Type"] = contentType;
    }
  }

  const sub = substituteAll(
    {
      url: mergedUrl,
      headers: headerMap,
      body: rawBody,
      params: paramRecord
    },
    envMap
  );

  const finalHeaders: Record<string, string> = { ...sub.headers };
  const method = String(payload.method || "GET").toUpperCase();
  const bodyStr = sub.body;

  const canHaveBody = !["GET", "HEAD"].includes(method);
  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch(sub.url, {
      method,
      headers: finalHeaders,
      body: canHaveBody && bodyStr.length > 0 ? bodyStr : canHaveBody ? bodyStr : undefined
    });
  } catch (e) {
    const duration_ms = Date.now() - t0;
    const message = e instanceof Error ? e.message : "fetch failed";
    throw new Error(message);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const duration_ms = Date.now() - t0;
  const text = buf.toString("utf8");

  const outHeaders: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    outHeaders[k] = v;
  });

  return {
    status: res.status,
    statusText: res.statusText || "",
    headers: outHeaders,
    body: text,
    duration_ms,
    size_bytes: buf.length,
    warnings: sub.warnings
  };
}

export function payloadFromSaved(
  saved: import("./types.js").SavedRequest
): BuilderSendPayload {
  return {
    method: saved.method,
    url: saved.url,
    headers: saved.headers || [],
    body: saved.bodyText || "",
    bodyFormat: saved.bodyFormat || "json",
    formFields: saved.formFields || [],
    params: saved.params || [],
    auth: saved.auth
  };
}

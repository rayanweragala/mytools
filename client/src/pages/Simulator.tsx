import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Link } from "react-router-dom";
import { apiGet } from "../api/client";

interface RequestLog {
  id: number;
  endpoint: string;
  timestamp: string;
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  rawBody: string;
  authValid: boolean;
  returnedStatusCode: number;
  forwardStatus: number | null;
  forwardError: string | null;
  note: string;
  replayed: boolean;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  durationMs?: number;
}

interface StateResponse {
  logs: RequestLog[];
  endpointKeys: string[];
}

type TimeRange = "5m" | "15m" | "1h" | "all" | "custom";

type StatusRange = "2xx" | "3xx" | "4xx" | "5xx";

function statusRangeOf(status: number): StatusRange {
  if (status >= 500) return "5xx";
  if (status >= 400) return "4xx";
  if (status >= 300) return "3xx";
  return "2xx";
}

function deriveSource(log: RequestLog): "live" | "replayed" | "chaos" {
  if (log.replayed) return "replayed";
  if ((log.note || "").toLowerCase().includes("chaos")) return "chaos";
  return "live";
}

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? "");
  }
}

function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }
  window.prompt("Copy", value);
  return Promise.resolve();
}

function jsonToCsv(rows: RequestLog[]): string {
  const headers = [
    "id",
    "timestamp",
    "method",
    "path",
    "endpoint",
    "status",
    "auth",
    "source",
    "durationMs",
    "note"
  ];
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`;
  const lines = rows.map((row) =>
    [
      row.id,
      row.timestamp,
      row.method,
      row.path,
      row.endpoint,
      row.returnedStatusCode,
      row.authValid ? "ok" : "fail",
      deriveSource(row),
      row.durationMs ?? "",
      row.note || ""
    ]
      .map(esc)
      .join(",")
  );
  return `${headers.join(",")}\n${lines.join("\n")}`;
}

function toHar(logs: RequestLog[]): object {
  return {
    log: {
      version: "1.2",
      creator: { name: "mytools", version: "1.0" },
      entries: logs.map((log) => ({
        startedDateTime: log.timestamp,
        time: log.durationMs ?? 0,
        request: {
          method: log.method,
          url: `${window.location.origin}${log.path}`,
          headers: Object.entries(log.headers || {}).map(([name, value]) => ({ name, value: Array.isArray(value) ? value[0] || "" : value || "" })),
          postData: { mimeType: "application/json", text: log.rawBody || "" }
        },
        response: {
          status: log.returnedStatusCode,
          statusText: String(log.returnedStatusCode),
          headers: Object.entries(log.responseHeaders || {}).map(([name, value]) => ({ name, value })),
          content: { mimeType: "application/json", text: toText(log.responseBody) }
        }
      }))
    }
  };
}

function downloadBlob(filename: string, text: string, mime = "application/json") {
  const blob = new Blob([text], { type: mime });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ago`;
}

function objectDiffSummary(prev: unknown, next: unknown): string[] {
  if (!prev || !next || typeof prev !== "object" || typeof next !== "object") {
    return ["No structured diff available"];
  }
  const prevRecord = prev as Record<string, unknown>;
  const nextRecord = next as Record<string, unknown>;
  const keys = new Set([...Object.keys(prevRecord), ...Object.keys(nextRecord)]);
  const out: string[] = [];
  keys.forEach((key) => {
    const a = JSON.stringify(prevRecord[key]);
    const b = JSON.stringify(nextRecord[key]);
    if (a !== b) {
      out.push(`${key}: ${a ?? "<none>"} -> ${b ?? "<none>"}`);
    }
  });
  return out.length ? out : ["No field-level changes"];
}

export function Simulator() {
  const [methods, setMethods] = useState<Set<string>>(new Set());
  const [statusRanges, setStatusRanges] = useState<Set<StatusRange>>(new Set());
  const [endpoints, setEndpoints] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<TimeRange>("15m");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [authFilter, setAuthFilter] = useState<"all" | "ok" | "fail">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "live" | "replayed" | "chaos">("all");
  const [selectedLogIds, setSelectedLogIds] = useState<Set<number>>(new Set());
  const [activeLogId, setActiveLogId] = useState<number | null>(null);
  const [replaying, setReplaying] = useState(false);

  const stateQuery = useQuery({
    queryKey: ["state", "simulator"],
    queryFn: () => apiGet<StateResponse>("/api/state"),
    refetchInterval: 2500
  });

  const logs = stateQuery.data?.logs || [];
  const endpointKeys = stateQuery.data?.endpointKeys || [];

  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const fromTs =
      timeRange === "5m"
        ? now - 5 * 60 * 1000
        : timeRange === "15m"
          ? now - 15 * 60 * 1000
          : timeRange === "1h"
            ? now - 60 * 60 * 1000
            : timeRange === "custom" && customFrom
              ? new Date(customFrom).getTime()
              : -Infinity;
    const toTs = timeRange === "custom" && customTo ? new Date(customTo).getTime() : Infinity;

    return logs.filter((log) => {
      const ts = new Date(log.timestamp).getTime();
      if (ts < fromTs || ts > toTs) return false;
      if (methods.size > 0 && !methods.has(log.method.toUpperCase())) return false;
      if (statusRanges.size > 0 && !statusRanges.has(statusRangeOf(log.returnedStatusCode))) return false;
      if (endpoints.size > 0 && !endpoints.has(log.endpoint)) return false;
      if (authFilter === "ok" && !log.authValid) return false;
      if (authFilter === "fail" && log.authValid) return false;
      const source = deriveSource(log);
      if (sourceFilter !== "all" && source !== sourceFilter) return false;
      return true;
    });
  }, [authFilter, customFrom, customTo, endpoints, logs, methods, sourceFilter, statusRanges, timeRange]);

  const activeLog = filteredLogs.find((log) => log.id === activeLogId) || null;

  const previousSameEndpoint = useMemo(() => {
    if (!activeLog) return null;
    const idx = logs.findIndex((entry) => entry.id === activeLog.id);
    if (idx < 0) return null;
    for (let i = idx + 1; i < logs.length; i += 1) {
      if (logs[i].endpoint === activeLog.endpoint) {
        return logs[i];
      }
    }
    return null;
  }, [activeLog, logs]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 86,
    overscan: 12
  });

  const toggleSetValue = <T,>(setState: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => {
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleSelectedLog = (id: number) => {
    setSelectedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const replaySelected = async () => {
    if (!selectedLogIds.size) return;
    setReplaying(true);
    const ids = Array.from(selectedLogIds);
    for (const id of ids) {
      // Sequential replay keeps request ordering deterministic.
      await fetch(`/api/logs/${id}/replay`, { method: "POST" });
    }
    setReplaying(false);
    setSelectedLogIds(new Set());
  };

  return (
    <section className={`simulator-grid ${activeLog ? "has-drawer" : "no-drawer"}`}>
      <article className="page-card">
        <div className="simulator-head-row">
          <h1>Simulator Logs</h1>
          <Link className="shell-btn" to="/simulator/endpoints">
            Endpoint Manager
          </Link>
        </div>

        <div className="filter-grid">
          <div className="chip-row">
            {(["GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((method) => (
              <button
                key={method}
                type="button"
                className={`chip-btn ${methods.has(method) ? "is-active" : ""}`}
                onClick={() => toggleSetValue(setMethods, method)}
              >
                {method}
              </button>
            ))}
          </div>

          <div className="chip-row">
            {(["2xx", "3xx", "4xx", "5xx"] as const).map((range) => (
              <button
                key={range}
                type="button"
                className={`chip-btn ${statusRanges.has(range) ? "is-active" : ""}`}
                onClick={() => toggleSetValue(setStatusRanges, range)}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="chip-row endpoint-chip-row">
            {endpointKeys.map((endpoint) => (
              <button
                key={endpoint}
                type="button"
                className={`chip-btn ${endpoints.has(endpoint) ? "is-active" : ""}`}
                onClick={() => toggleSetValue(setEndpoints, endpoint)}
              >
                {endpoint}
              </button>
            ))}
          </div>

          <div className="sim-filter-row">
            <label>
              Time
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRange)}>
                <option value="5m">Last 5m</option>
                <option value="15m">Last 15m</option>
                <option value="1h">Last 1h</option>
                <option value="all">All</option>
                <option value="custom">Custom</option>
              </select>
            </label>

            {timeRange === "custom" && (
              <>
                <label>
                  From
                  <input type="datetime-local" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                </label>
                <label>
                  To
                  <input type="datetime-local" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                </label>
              </>
            )}

            <label>
              Auth
              <select value={authFilter} onChange={(e) => setAuthFilter(e.target.value as "all" | "ok" | "fail")}>
                <option value="all">All</option>
                <option value="ok">ok</option>
                <option value="fail">fail</option>
              </select>
            </label>

            <label>
              Source
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as "all" | "live" | "replayed" | "chaos")}
              >
                <option value="all">All</option>
                <option value="live">live</option>
                <option value="replayed">replayed</option>
                <option value="chaos">chaos</option>
              </select>
            </label>
          </div>
        </div>

        <div className="sim-actions">
          <button type="button" className="shell-btn" disabled={replaying || selectedLogIds.size === 0} onClick={replaySelected}>
            {replaying ? "Replaying..." : `Replay Selected (${selectedLogIds.size})`}
          </button>
          <button
            type="button"
            className="shell-btn"
            onClick={() => downloadBlob("logs.json", JSON.stringify(filteredLogs, null, 2), "application/json")}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="shell-btn"
            onClick={() => downloadBlob("logs.csv", jsonToCsv(filteredLogs), "text/csv")}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="shell-btn"
            onClick={() => downloadBlob("logs.har", JSON.stringify(toHar(filteredLogs), null, 2), "application/json")}
          >
            Export HAR
          </button>
        </div>

        <div className="virtual-list" ref={parentRef}>
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const log = filteredLogs[virtualRow.index];
              const source = deriveSource(log);
              return (
                <article
                  key={log.id}
                  className="sim-log-row"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                  onClick={() => setActiveLogId(log.id)}
                >
                  <div className="sim-log-row-left">
                    <input
                      type="checkbox"
                      checked={selectedLogIds.has(log.id)}
                      onChange={() => toggleSelectedLog(log.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <strong>{log.method}</strong>
                    <code>{log.path}</code>
                  </div>
                  <div className="sim-log-row-right">
                    <span className={`status-pill status-${statusRangeOf(log.returnedStatusCode)}`}>{log.returnedStatusCode}</span>
                    <span>{log.durationMs ?? 0}ms</span>
                    <span>{log.authValid ? "auth ok" : "auth fail"}</span>
                    <span className="source-pill">{source}</span>
                    <span>{relativeTime(log.timestamp)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </article>

      {activeLog && (
        <aside className="sim-drawer page-card">
          <div className="sim-drawer-head">
            <h1>Log #{activeLog.id}</h1>
            <button type="button" className="shell-btn" onClick={() => setActiveLogId(null)}>
              Close
            </button>
          </div>

          <div className="sim-detail-block">
            <h2>Request</h2>
            <p>
              <strong>{activeLog.method}</strong> <code>{activeLog.path}</code>
            </p>
            <button type="button" className="shell-btn" onClick={() => void copyText(toText(activeLog.headers))}>
              Copy Headers
            </button>
            <button type="button" className="shell-btn" onClick={() => void copyText(toText(activeLog.body))}>
              Copy Body
            </button>
            <pre>{toText(activeLog.headers)}</pre>
            <pre>{toText(activeLog.body)}</pre>
          </div>

          <div className="sim-detail-block">
            <h2>Response</h2>
            <p>
              Status <strong>{activeLog.returnedStatusCode}</strong> • {activeLog.durationMs ?? 0}ms
            </p>
            <button type="button" className="shell-btn" onClick={() => void copyText(toText(activeLog.responseHeaders || {}))}>
              Copy Response Headers
            </button>
            <button type="button" className="shell-btn" onClick={() => void copyText(toText(activeLog.responseBody || {}))}>
              Copy Response Body
            </button>
            <pre>{toText(activeLog.responseHeaders || {})}</pre>
            <pre>{toText(activeLog.responseBody || {})}</pre>
          </div>

          <div className="sim-detail-block">
            <h2>Diff vs Previous ({activeLog.endpoint})</h2>
            {previousSameEndpoint ? (
              <ul className="simple-list">
                {objectDiffSummary(previousSameEndpoint.body, activeLog.body).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p>No previous request for this endpoint.</p>
            )}
          </div>
        </aside>
      )}
    </section>
  );
}

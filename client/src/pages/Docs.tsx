import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/client";

interface EndpointConfig {
  authType: "NONE" | "API_KEY" | "BEARER";
  apiKeyHeaderName: string;
  apiKeyValue: string;
  bearerToken: string;
  defaultStatusCode: number;
  statusCodes: number[];
  responseBody: string;
}

interface EndpointsResponse {
  endpoints: Array<{
    key: string;
    webhookUrl: string;
    config: EndpointConfig;
  }>;
}

interface CollectionRequest {
  id: string;
  name: string;
  method: string;
  url: string;
}

interface CollectionsResponse {
  collections: Array<{
    id: string;
    name: string;
    requests: CollectionRequest[];
  }>;
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

function authSample(cfg: EndpointConfig): { title: string; header: string } {
  if (cfg.authType === "API_KEY") {
    return {
      title: "API_KEY",
      header: `${cfg.apiKeyHeaderName}: ${cfg.apiKeyValue}`
    };
  }
  if (cfg.authType === "BEARER") {
    return {
      title: "BEARER",
      header: `Authorization: Bearer ${cfg.bearerToken}`
    };
  }
  return { title: "NONE", header: "(none)" };
}

export function Docs() {
  const [activeEndpoint, setActiveEndpoint] = useState("");
  const [tryResult, setTryResult] = useState("");
  const [trying, setTrying] = useState(false);

  const endpointsQuery = useQuery({
    queryKey: ["docs", "endpoints"],
    queryFn: () => apiGet<EndpointsResponse>("/api/endpoints"),
    refetchInterval: 5000
  });
  const collectionsQuery = useQuery({
    queryKey: ["docs", "collections"],
    queryFn: () => apiGet<CollectionsResponse>("/api/collections")
  });

  const endpoints = endpointsQuery.data?.endpoints || [];
  const collections = collectionsQuery.data?.collections || [];

  const selected = useMemo(() => {
    if (!endpoints.length) return null;
    const fallback = endpoints[0];
    if (!activeEndpoint) return fallback;
    return endpoints.find((e) => e.key === activeEndpoint) || fallback;
  }, [activeEndpoint, endpoints]);

  const examplesByEndpoint = useMemo(() => {
    const map = new Map<string, Array<{ collection: string; request: CollectionRequest }>>();
    endpoints.forEach((endpoint) => map.set(endpoint.key, []));

    for (const collection of collections) {
      for (const request of collection.requests || []) {
        for (const endpoint of endpoints) {
          if (request.url.includes(endpoint.webhookUrl)) {
            const rows = map.get(endpoint.key) || [];
            rows.push({ collection: collection.name, request });
            map.set(endpoint.key, rows);
          }
        }
      }
    }
    return map;
  }, [collections, endpoints]);

  const exportMarkdown = () => {
    const lines: string[] = [];
    lines.push("# mytools Webhook API Docs");
    lines.push("");
    for (const endpoint of endpoints) {
      const auth = authSample(endpoint.config);
      lines.push(`## POST ${endpoint.webhookUrl}`);
      lines.push("");
      lines.push(`- Auth: ${auth.title}`);
      lines.push(`- Default status: ${endpoint.config.defaultStatusCode}`);
      lines.push("");
      lines.push("### Sample curl");
      lines.push("```bash");
      lines.push(`curl -X POST ${window.location.origin}${endpoint.webhookUrl} \\\n  -H 'Content-Type: application/json'${
        auth.header !== "(none)" ? ` \\\n  -H '${auth.header}'` : ""
      } \\\n  -d '${JSON.stringify(safeJson(endpoint.config.responseBody))}'`);
      lines.push("```");
      lines.push("");
    }
    downloadText("mytools-docs.md", lines.join("\n"), "text/markdown");
  };

  const exportHtml = () => {
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>mytools docs</title>
<style>
body{font-family:Arial,sans-serif;padding:24px;background:#f5f4fb;color:#1f1736}
.card{background:#fff;border:1px solid #ddd;border-radius:10px;padding:14px;margin-bottom:12px}
pre{background:#111;color:#f5f5f5;padding:10px;border-radius:8px;overflow:auto}
</style>
</head>
<body>
<h1>mytools Webhook API Docs</h1>
${endpoints
  .map((endpoint) => {
    const auth = authSample(endpoint.config);
    return `<div class="card"><h2>POST ${endpoint.webhookUrl}</h2><p>Auth: ${auth.title}</p><p>Default status: ${
      endpoint.config.defaultStatusCode
    }</p><pre>${`curl -X POST ${window.location.origin}${endpoint.webhookUrl} -H 'Content-Type: application/json'${
      auth.header !== "(none)" ? ` -H '${auth.header}'` : ""
    } -d '${JSON.stringify(safeJson(endpoint.config.responseBody))}'`}</pre></div>`;
  })
  .join("\n")}
</body>
</html>`;
    downloadText("mytools-docs.html", html, "text/html");
  };

  const exportOpenApi = async () => {
    const text = await fetch("/api/docs/openapi.yaml", { cache: "no-store" }).then((r) => r.text());
    downloadText("openapi.yaml", text, "application/x-yaml");
  };

  const tryItOut = async () => {
    if (!selected) return;
    setTrying(true);
    setTryResult("");
    try {
      const response = await fetch(selected.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "docs.try",
          endpoint: selected.key,
          timestamp: new Date().toISOString()
        })
      });
      const bodyText = await response.text();
      setTryResult(`Status: ${response.status}\n${bodyText}`);
    } catch (error) {
      setTryResult(error instanceof Error ? error.message : "Try it out failed");
    } finally {
      setTrying(false);
    }
  };

  return (
    <section className="docs-grid">
      <article className="page-card docs-head">
        <h1>API Documentation</h1>
        <div className="settings-actions-row">
          <button type="button" className="shell-btn" onClick={exportHtml}>
            Export HTML
          </button>
          <button type="button" className="shell-btn" onClick={exportMarkdown}>
            Export Markdown
          </button>
          <button type="button" className="shell-btn" onClick={() => void exportOpenApi()}>
            Export OpenAPI
          </button>
        </div>
      </article>

      <article className="page-card docs-endpoint-list">
        <h2>Endpoints</h2>
        <div className="docs-card-list">
          {endpoints.map((endpoint) => {
            const auth = authSample(endpoint.config);
            const examples = examplesByEndpoint.get(endpoint.key) || [];
            const curl = `curl -X POST ${window.location.origin}${endpoint.webhookUrl} \\\n  -H 'Content-Type: application/json'${auth.header !== "(none)" ? ` \\\n  -H '${auth.header}'` : ""} \\\n  -d '${JSON.stringify(safeJson(endpoint.config.responseBody))}'`;
            return (
              <article key={endpoint.key} className="docs-endpoint-card">
                <header className="docs-endpoint-head">
                  <button type="button" className="chip-btn" onClick={() => setActiveEndpoint(endpoint.key)}>
                    POST {endpoint.webhookUrl}
                  </button>
                  <span className="status-pill">{auth.title}</span>
                </header>
                <p>Default status: {endpoint.config.defaultStatusCode}</p>
                <pre>{curl}</pre>
                <pre>{pretty(safeJson(endpoint.config.responseBody))}</pre>
                <h3>Collection Examples</h3>
                {examples.length > 0 ? (
                  <ul className="simple-list">
                    {examples.slice(0, 6).map((example) => (
                      <li key={`${endpoint.key}-${example.request.id}`}>
                        <strong>{example.collection}</strong> - {example.request.method} {example.request.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No collection examples found.</p>
                )}
              </article>
            );
          })}
          {endpoints.length === 0 && <p>No endpoints yet.</p>}
        </div>
      </article>

      <article className="page-card docs-try-card">
        <h2>Try It Out</h2>
        <p>Selected endpoint: {selected?.webhookUrl || "-"}</p>
        <button type="button" className="shell-btn" disabled={!selected || trying} onClick={() => void tryItOut()}>
          {trying ? "Sending..." : "Send Test Request"}
        </button>
        <pre>{tryResult || "No try-it-out result yet."}</pre>
      </article>
    </section>
  );
}

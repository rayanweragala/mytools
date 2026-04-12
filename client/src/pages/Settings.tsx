import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "../api/client";

interface FeaturesResponse {
  aiEnabled: boolean;
  localAiEnabled: boolean;
  geminiEnabled: boolean;
  ngrokEnabled: boolean;
}

interface TunnelStatus {
  active: boolean;
  url: string | null;
}

interface EndpointConfig {
  authType: "NONE" | "API_KEY" | "BEARER";
  defaultStatusCode: number;
  responseDelayMs: number;
  responseBody: string;
  responseHeaders: Record<string, string>;
  statusCodes: number[];
  apiKeyHeaderName: string;
  apiKeyValue: string;
  bearerToken: string;
  forwardUrl: string;
}

interface EndpointsResponse {
  endpoints: Array<{ key: string; webhookUrl: string; config: EndpointConfig }>;
}

interface CollectionsResponse {
  collections: Array<{
    id: string;
    name: string;
    requests: Array<{
      name: string;
      method: string;
      url: string;
      headers: unknown[];
      bodyFormat: "json" | "text" | "form";
      bodyText: string;
      formFields: unknown[];
      params: unknown[];
      auth: unknown;
    }>;
  }>;
}

interface EnvironmentsResponse {
  environments: Array<{
    id: string;
    name: string;
    variables: Array<{ key: string; value: string; secret: boolean }>;
  }>;
  activeEnvironmentId: string | null;
}

interface ProfilesResponse extends Array<{ id: string; name: string; savedAt: string }> {}

interface StateResponse {
  logs: Array<{ id: number }>;
}

const TEMPLATE_KEY = "mytools_endpoint_template";
const APPEARANCE_KEY = "mytools_appearance";

type Theme = "dark" | "light" | "system";
type FontSize = "normal" | "large";

interface AppearanceState {
  theme: Theme;
  accent: string;
  compact: boolean;
  fontSize: FontSize;
}

function normalizeEndpointName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "-");
}

function loadTemplate(): Partial<EndpointConfig> {
  try {
    const raw = window.localStorage.getItem(TEMPLATE_KEY);
    return raw ? (JSON.parse(raw) as Partial<EndpointConfig>) : {};
  } catch {
    return {};
  }
}

function saveTemplate(value: Partial<EndpointConfig>) {
  window.localStorage.setItem(TEMPLATE_KEY, JSON.stringify(value));
}

function loadAppearance(): AppearanceState {
  try {
    const raw = window.localStorage.getItem(APPEARANCE_KEY);
    if (!raw) {
      return { theme: "dark", accent: "#8f7cff", compact: false, fontSize: "normal" };
    }
    const parsed = JSON.parse(raw) as AppearanceState;
    return {
      theme: parsed.theme || "dark",
      accent: parsed.accent || "#8f7cff",
      compact: Boolean(parsed.compact),
      fontSize: parsed.fontSize || "normal"
    };
  } catch {
    return { theme: "dark", accent: "#8f7cff", compact: false, fontSize: "normal" };
  }
}

function applyAppearance(appearance: AppearanceState) {
  const root = document.documentElement;
  root.dataset.theme = appearance.theme;
  root.dataset.compact = appearance.compact ? "1" : "0";
  root.dataset.fontSize = appearance.fontSize;
  root.style.setProperty("--accent-primary", appearance.accent);
  window.localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
}

export function Settings() {
  const queryClient = useQueryClient();
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const [busy, setBusy] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [template, setTemplate] = useState<Partial<EndpointConfig>>(() => loadTemplate());
  const [appearance, setAppearance] = useState<AppearanceState>(() => loadAppearance());

  const featuresQuery = useQuery({
    queryKey: ["settings", "features"],
    queryFn: () => apiGet<FeaturesResponse>("/api/config/features"),
    refetchInterval: 12000
  });
  const tunnelQuery = useQuery({
    queryKey: ["settings", "tunnel"],
    queryFn: () => apiGet<TunnelStatus>("/api/tunnel/status"),
    refetchInterval: 8000
  });
  const endpointsQuery = useQuery({
    queryKey: ["settings", "endpoints"],
    queryFn: () => apiGet<EndpointsResponse>("/api/endpoints"),
    refetchInterval: 5000
  });
  const stateQuery = useQuery({
    queryKey: ["settings", "state"],
    queryFn: () => apiGet<StateResponse>("/api/state"),
    refetchInterval: 5000
  });

  const endpointRows = endpointsQuery.data?.endpoints || [];
  const aiProvider = useMemo(() => {
    if (featuresQuery.data?.localAiEnabled) return "Local AI";
    if (featuresQuery.data?.geminiEnabled) return "Gemini";
    return "Disabled";
  }, [featuresQuery.data]);

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["settings"] }),
      queryClient.invalidateQueries({ queryKey: ["state"] }),
      queryClient.invalidateQueries({ queryKey: ["endpoints"] })
    ]);
  };

  const withBusy = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    setMessage("");
    try {
      await fn();
      setMessage("Done.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    } finally {
      setBusy("");
    }
  };

  const createEndpoint = async () => {
    const raw = window.prompt("Endpoint name", "payment-webhook");
    if (!raw) return;
    const name = normalizeEndpointName(raw);
    if (!name) return;
    await withBusy("create-endpoint", async () => {
      await apiPost<{ success: boolean; key: string }>("/api/endpoints", { name });
      if (Object.keys(template).length) {
        await apiPut(`/api/config/${encodeURIComponent(name)}`, template);
      }
      await refreshAll();
    });
  };

  const renameEndpoint = async (key: string) => {
    const raw = window.prompt(`Rename ${key}`, key);
    if (!raw) return;
    const name = normalizeEndpointName(raw);
    if (!name) return;
    await withBusy(`rename-${key}`, async () => {
      await apiPatch(`/api/endpoints/${encodeURIComponent(key)}/rename`, { name });
      await refreshAll();
    });
  };

  const duplicateEndpoint = async (key: string) => {
    const raw = window.prompt(`Duplicate ${key} as`, `${key}-copy`);
    if (!raw) return;
    const name = normalizeEndpointName(raw);
    if (!name) return;
    await withBusy(`dup-${key}`, async () => {
      await apiPost(`/api/endpoints/${encodeURIComponent(key)}/duplicate`, { name });
      await refreshAll();
    });
  };

  const deleteEndpoint = async (key: string) => {
    if (!window.confirm(`Delete endpoint ${key}?`)) return;
    await withBusy(`del-${key}`, async () => {
      await apiDelete(`/api/endpoints/${encodeURIComponent(key)}`);
      await refreshAll();
    });
  };

  const resetEndpointsToDefaults = async () => {
    if (!window.confirm("Reset endpoints to defaults (incoming-call, call-answer, call-end)?")) return;
    await withBusy("reset-default-endpoints", async () => {
      await apiPost("/api/endpoints/reset-defaults", {});
      await refreshAll();
    });
  };

  const testAiConnection = async () => {
    await withBusy("ai-test", async () => {
      await apiPost("/api/ai/generate", {
        prompt: "Return a tiny valid JSON object with key status and value ok.",
        context: "settings_test"
      });
    });
  };

  const toggleTunnel = async () => {
    await withBusy("toggle-tunnel", async () => {
      const status = await apiGet<TunnelStatus>("/api/tunnel/status");
      await apiPost(status.active ? "/api/tunnel/stop" : "/api/tunnel/start", {});
      await refreshAll();
    });
  };

  const exportAllData = async () => {
    await withBusy("export-all", async () => {
      const [state, endpoints, collections, environments, profiles] = await Promise.all([
        apiGet<StateResponse>("/api/state"),
        apiGet<EndpointsResponse>("/api/endpoints"),
        apiGet<CollectionsResponse>("/api/collections"),
        apiGet<EnvironmentsResponse>("/api/environments"),
        apiGet<ProfilesResponse>("/api/profiles")
      ]);
      const bundle = {
        exportedAt: new Date().toISOString(),
        endpoints,
        collections,
        environments,
        profiles,
        logCount: state.logs.length
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `mytools-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(href);
    });
  };

  const importAllData = async (file: File) => {
    await withBusy("import-all", async () => {
      const text = await file.text();
      const bundle = JSON.parse(text) as {
        endpoints?: EndpointsResponse;
        collections?: CollectionsResponse;
        environments?: EnvironmentsResponse;
      };

      for (const endpoint of bundle.endpoints?.endpoints || []) {
        try {
          await apiPost("/api/endpoints/import", { key: endpoint.key, config: endpoint.config });
        } catch {
          // Skip existing conflicts.
        }
      }

      for (const collection of bundle.collections?.collections || []) {
        await apiPost("/api/collections/import", {
          name: collection.name,
          requests: collection.requests
        });
      }

      for (const env of bundle.environments?.environments || []) {
        const created = await apiPost<{ environment: { id: string } }>("/api/environments", { name: env.name });
        await apiPut(`/api/environments/${encodeURIComponent(created.environment.id)}/variables`, {
          variables: env.variables
        });
      }

      await refreshAll();
    });
  };

  const clearLogs = async () => {
    if (!window.confirm("Clear all logs?")) return;
    await withBusy("clear-logs", async () => {
      await apiPost("/api/logs/clear", {});
      await refreshAll();
    });
  };

  const clearAllData = async () => {
    const confirmText = window.prompt('Type "CLEAR" to remove collections, environments, extra endpoints, and logs');
    if (confirmText !== "CLEAR") return;
    await withBusy("clear-all", async () => {
      const [collections, environments, endpoints, profiles] = await Promise.all([
        apiGet<CollectionsResponse>("/api/collections"),
        apiGet<EnvironmentsResponse>("/api/environments"),
        apiGet<EndpointsResponse>("/api/endpoints"),
        apiGet<ProfilesResponse>("/api/profiles")
      ]);

      for (const collection of collections.collections) {
        await apiDelete(`/api/collections/${encodeURIComponent(collection.id)}`);
      }

      for (const environment of environments.environments) {
        await apiDelete(`/api/environments/${encodeURIComponent(environment.id)}`);
      }

      for (const endpoint of endpoints.endpoints) {
        if (!["incoming-call", "call-answer", "call-end"].includes(endpoint.key)) {
          await apiDelete(`/api/endpoints/${encodeURIComponent(endpoint.key)}`);
        }
      }

      for (const profile of profiles) {
        await apiDelete(`/api/profiles/${encodeURIComponent(profile.id)}`);
      }

      await apiPost("/api/config/reset", {});
      await apiPost("/api/endpoints/reset-defaults", {});
      await apiPost("/api/logs/clear", {});
      await refreshAll();
    });
  };

  return (
    <section className="settings-grid">
      <article className="page-card">
        <h1>AI Configuration</h1>
        <p>Provider: {aiProvider}</p>
        <p>AI enabled: {featuresQuery.data?.aiEnabled ? "Yes" : "No"}</p>
        <button type="button" className="shell-btn" disabled={busy === "ai-test"} onClick={testAiConnection}>
          {busy === "ai-test" ? "Testing..." : "Test Connection"}
        </button>
      </article>

      <article className="page-card">
        <h1>Ngrok Configuration</h1>
        <p>Status: {tunnelQuery.data?.active ? "Active" : "Inactive"}</p>
        <p>URL: {tunnelQuery.data?.url || "-"}</p>
        <button type="button" className="shell-btn" disabled={busy === "toggle-tunnel"} onClick={toggleTunnel}>
          {busy === "toggle-tunnel"
            ? "Working..."
            : tunnelQuery.data?.active
              ? "Stop Tunnel"
              : "Start Tunnel"}
        </button>
      </article>

      <article className="page-card settings-span-2">
        <h1>Webhook Endpoints</h1>
        <div className="settings-actions-row">
          <button type="button" className="shell-btn" onClick={createEndpoint}>
            + New Endpoint
          </button>
          <button type="button" className="shell-btn" onClick={resetEndpointsToDefaults}>
            Reset Endpoints To Defaults
          </button>
        </div>
        <div className="settings-table">
          {endpointRows.map((endpoint) => (
            <div key={endpoint.key} className="settings-table-row">
              <div>
                <strong>{endpoint.key}</strong>
                <p>{endpoint.webhookUrl}</p>
              </div>
              <div className="settings-actions-row">
                <button type="button" className="shell-btn" onClick={() => renameEndpoint(endpoint.key)}>
                  Rename
                </button>
                <button type="button" className="shell-btn" onClick={() => duplicateEndpoint(endpoint.key)}>
                  Duplicate
                </button>
                <button
                  type="button"
                  className="shell-btn"
                  onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${endpoint.webhookUrl}`)}
                >
                  Copy URL
                </button>
                <button type="button" className="shell-btn" onClick={() => deleteEndpoint(endpoint.key)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="settings-template-grid">
          <h2>Default Endpoint Template</h2>
          <label>
            Default Status Code
            <input
              type="number"
              min={100}
              max={599}
              value={template.defaultStatusCode ?? 200}
              onChange={(e) =>
                setTemplate((prev) => ({
                  ...prev,
                  defaultStatusCode: Number(e.target.value)
                }))
              }
            />
          </label>
          <label>
            Response Delay (ms)
            <input
              type="number"
              min={0}
              value={template.responseDelayMs ?? 0}
              onChange={(e) =>
                setTemplate((prev) => ({
                  ...prev,
                  responseDelayMs: Number(e.target.value)
                }))
              }
            />
          </label>
          <label className="settings-span-2">
            Response Body
            <textarea
              rows={6}
              value={template.responseBody ?? "{\n  \"status\": \"ok\"\n}"}
              onChange={(e) => setTemplate((prev) => ({ ...prev, responseBody: e.target.value }))}
            />
          </label>
          <button
            type="button"
            className="shell-btn"
            onClick={() => {
              saveTemplate(template);
              setMessage("Endpoint template saved.");
            }}
          >
            Save Template
          </button>
        </div>
      </article>

      <article className="page-card">
        <h1>Appearance</h1>
        <div className="sim-filter-row">
          <label>
            Theme
            <select
              value={appearance.theme}
              onChange={(e) => {
                const next = { ...appearance, theme: e.target.value as Theme };
                setAppearance(next);
                applyAppearance(next);
              }}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </label>
          <label>
            Accent
            <input
              type="color"
              value={appearance.accent}
              onChange={(e) => {
                const next = { ...appearance, accent: e.target.value };
                setAppearance(next);
                applyAppearance(next);
              }}
            />
          </label>
          <label>
            Font Size
            <select
              value={appearance.fontSize}
              onChange={(e) => {
                const next = { ...appearance, fontSize: e.target.value as FontSize };
                setAppearance(next);
                applyAppearance(next);
              }}
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
            </select>
          </label>
          <label>
            Compact Mode
            <select
              value={appearance.compact ? "on" : "off"}
              onChange={(e) => {
                const next = { ...appearance, compact: e.target.value === "on" };
                setAppearance(next);
                applyAppearance(next);
              }}
            >
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </label>
        </div>
      </article>

      <article className="page-card">
        <h1>Data Management</h1>
        <p>Storage usage: {stateQuery.data?.logs.length || 0} logs in memory</p>
        <div className="settings-actions-col">
          <button type="button" className="shell-btn" onClick={exportAllData}>
            Export All Data
          </button>
          <button type="button" className="shell-btn" onClick={() => importFileRef.current?.click()}>
            Import Data Bundle
          </button>
          <input
            ref={importFileRef}
            className="visually-hidden"
            type="file"
            accept="application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = "";
              if (!file) return;
              await importAllData(file);
            }}
          />
          <button type="button" className="shell-btn" onClick={clearLogs}>
            Clear All Logs
          </button>
          <button type="button" className="shell-btn" onClick={clearAllData}>
            Clear All Data
          </button>
        </div>
      </article>

      <div className="settings-message" aria-live="polite">
        {busy ? `Working: ${busy}` : message}
      </div>
    </section>
  );
}

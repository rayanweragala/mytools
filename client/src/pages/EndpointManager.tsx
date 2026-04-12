import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiPut } from "../api/client";
import { useEndpoints } from "../hooks/useEndpoints";
import { useAppStore } from "../stores/appStore";

interface EndpointConfig {
  authType: "NONE" | "API_KEY" | "BEARER";
  defaultStatusCode: number;
  responseDelayMs: number;
  responseBody: string;
  responseHeaders: Record<string, string>;
  statusCodes: number[];
}

interface EndpointDraft {
  defaultStatusCode: number;
  responseDelayMs: number;
  responseBody: string;
  responseHeaders: string;
}

function toDraft(config: EndpointConfig): EndpointDraft {
  return {
    defaultStatusCode: config.defaultStatusCode,
    responseDelayMs: config.responseDelayMs,
    responseBody: config.responseBody || "",
    responseHeaders: JSON.stringify(config.responseHeaders || {}, null, 2)
  };
}

function draftSignature(draft: EndpointDraft): string {
  return JSON.stringify(draft);
}

function configSignature(config: EndpointConfig): string {
  return draftSignature(toDraft(config));
}

export function EndpointManager() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useEndpoints();
  const clientCount = useAppStore((s) => s.clientCount);

  const endpoints = data?.endpoints || [];

  const [selectedKey, setSelectedKey] = useState("");
  const [draft, setDraft] = useState<EndpointDraft | null>(null);
  const [baselineSig, setBaselineSig] = useState("");
  const [warning, setWarning] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => endpoints.find((endpoint) => endpoint.key === selectedKey) || endpoints[0],
    [endpoints, selectedKey]
  );

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      setBaselineSig("");
      return;
    }

    const serverSig = configSignature(selected.config as EndpointConfig);

    if (!draft) {
      setSelectedKey(selected.key);
      setDraft(toDraft(selected.config as EndpointConfig));
      setBaselineSig(serverSig);
      setWarning(false);
      return;
    }

    if (selected.key !== selectedKey) {
      setSelectedKey(selected.key);
      setDraft(toDraft(selected.config as EndpointConfig));
      setBaselineSig(serverSig);
      setWarning(false);
      return;
    }

    if (!baselineSig) {
      setBaselineSig(serverSig);
      return;
    }

    if (serverSig !== baselineSig) {
      const dirty = draftSignature(draft) !== baselineSig;
      if (dirty) {
        setWarning(true);
      } else {
        setDraft(toDraft(selected.config as EndpointConfig));
        setBaselineSig(serverSig);
        setWarning(false);
      }
    }
  }, [baselineSig, draft, selected, selectedKey]);

  const dirty = draft ? draftSignature(draft) !== baselineSig : false;

  const save = async () => {
    if (!selected || !draft) return;

    let parsedHeaders: Record<string, string> = {};
    try {
      parsedHeaders = JSON.parse(draft.responseHeaders || "{}");
    } catch {
      setMessage("Response headers must be valid JSON.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await apiPut(`/api/config/${encodeURIComponent(selected.key)}`, {
        defaultStatusCode: Number(draft.defaultStatusCode),
        responseDelayMs: Number(draft.responseDelayMs),
        responseBody: draft.responseBody,
        responseHeaders: parsedHeaders
      });
      await queryClient.invalidateQueries({ queryKey: ["endpoints"] });
      const nextSig = draftSignature(draft);
      setBaselineSig(nextSig);
      setWarning(false);
      setMessage("Saved endpoint config.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-card endpoint-manager-grid">
      <header className="endpoint-manager-head">
        <h1>Endpoint Manager</h1>
        <p>{clientCount} active sessions</p>
      </header>

      {isLoading && <p>Loading endpoints...</p>}
      {isError && <p>Failed to load endpoints.</p>}

      {!isLoading && !isError && selected && draft && (
        <>
          {warning && (
            <div className="endpoint-warning-banner" role="status" aria-live="polite">
              Another session updated this config. Refresh to see changes.
            </div>
          )}

          <div className="endpoint-manager-layout">
            <aside className="endpoint-manager-list">
              {endpoints.map((endpoint) => (
                <button
                  key={endpoint.key}
                  type="button"
                  className={`endpoint-row-btn ${selected.key === endpoint.key ? "is-active" : ""}`}
                  onClick={() => {
                    setSelectedKey(endpoint.key);
                    setWarning(false);
                    setMessage("");
                  }}
                >
                  <strong>{endpoint.key}</strong>
                  <code>{endpoint.webhookUrl}</code>
                </button>
              ))}
            </aside>

            <article className="endpoint-editor">
              <h2>{selected.key}</h2>
              <div className="sim-filter-row">
                <label>
                  Default Status
                  <input
                    type="number"
                    min={100}
                    max={599}
                    value={draft.defaultStatusCode}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              defaultStatusCode: Number(e.target.value)
                            }
                          : prev
                      )
                    }
                  />
                </label>
                <label>
                  Delay (ms)
                  <input
                    type="number"
                    min={0}
                    value={draft.responseDelayMs}
                    onChange={(e) =>
                      setDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              responseDelayMs: Number(e.target.value)
                            }
                          : prev
                      )
                    }
                  />
                </label>
              </div>

              <label className="settings-template-grid settings-span-2">
                <span>Response Headers (JSON)</span>
                <textarea
                  rows={8}
                  value={draft.responseHeaders}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            responseHeaders: e.target.value
                          }
                        : prev
                    )
                  }
                />
              </label>

              <label className="settings-template-grid settings-span-2">
                <span>Response Body</span>
                <textarea
                  rows={10}
                  value={draft.responseBody}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            responseBody: e.target.value
                          }
                        : prev
                    )
                  }
                />
              </label>

              <div className="settings-actions-row">
                <button type="button" className="shell-btn" disabled={!dirty || saving} onClick={() => void save()}>
                  {saving ? "Saving..." : "Save Config"}
                </button>
                {dirty && <span className="endpoint-dirty-hint">Unsaved changes</span>}
              </div>
              <div className="settings-message">{message}</div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}

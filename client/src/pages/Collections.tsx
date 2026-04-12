import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "../api/client";

interface KeyValueEnabled {
  key: string;
  value: string;
  enabled: boolean;
}

interface SavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: KeyValueEnabled[];
  bodyFormat: "json" | "text" | "form";
  bodyText: string;
  formFields: KeyValueEnabled[];
  params: KeyValueEnabled[];
  auth: Record<string, unknown>;
}

interface CollectionRecord {
  id: string;
  name: string;
  requests: SavedRequest[];
}

interface CollectionsResponse {
  collections: CollectionRecord[];
}

interface RunResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration_ms: number;
}

interface CollectionRunHistoryEntry {
  at: string;
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
}

const RUN_HISTORY_KEY = "mytools_collection_run_history";

function loadRunHistory(): Record<string, CollectionRunHistoryEntry[]> {
  try {
    const raw = window.localStorage.getItem(RUN_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CollectionRunHistoryEntry[]>) : {};
  } catch {
    return {};
  }
}

function saveRunHistory(value: Record<string, CollectionRunHistoryEntry[]>) {
  window.localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(value));
}

function requestToPathTag(name: string): { folder: string; label: string } {
  const idx = name.indexOf("/");
  if (idx <= 0) return { folder: "root", label: name };
  return { folder: name.slice(0, idx), label: name.slice(idx + 1) || name };
}

function toOpenApiYaml(collection: CollectionRecord): string {
  const lines: string[] = [];
  lines.push("openapi: 3.0.0");
  lines.push("info:");
  lines.push(`  title: "${collection.name.replaceAll("\"", "\\\"")}"`);
  lines.push("  version: " + "\"1.0.0\"");
  lines.push("paths:");

  for (const req of collection.requests) {
    let pathname = "/";
    try {
      pathname = new URL(req.url).pathname || "/";
    } catch {
      pathname = req.url || "/";
    }
    const method = req.method.toLowerCase();
    lines.push(`  "${pathname}":`);
    lines.push(`    ${method}:`);
    lines.push(`      summary: "${req.name.replaceAll("\"", "\\\"")}"`);
    lines.push("      responses:");
    lines.push("        '200':");
    lines.push("          description: \"Success\"");
  }

  return lines.join("\n") + "\n";
}

function truncate(value: string, max = 68): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function Collections() {
  const queryClient = useQueryClient();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [runningCollection, setRunningCollection] = useState(false);
  const [message, setMessage] = useState("");
  const [folderExpanded, setFolderExpanded] = useState<Record<string, boolean>>({ root: true });
  const [runHistory, setRunHistory] = useState<Record<string, CollectionRunHistoryEntry[]>>(() => loadRunHistory());

  const collectionsQuery = useQuery({
    queryKey: ["collections", "manager"],
    queryFn: () => apiGet<CollectionsResponse>("/api/collections")
  });

  const collections = collectionsQuery.data?.collections || [];

  const selectedCollection = useMemo(() => {
    const fallback = collections[0];
    if (!selectedCollectionId) return fallback;
    return collections.find((c) => c.id === selectedCollectionId) || fallback;
  }, [collections, selectedCollectionId]);

  const selectedRequest = useMemo(() => {
    if (!selectedCollection) return null;
    const fallback = selectedCollection.requests[0] || null;
    if (!selectedRequestId) return fallback;
    return selectedCollection.requests.find((r) => r.id === selectedRequestId) || fallback;
  }, [selectedCollection, selectedRequestId]);

  const groupedRequests = useMemo(() => {
    if (!selectedCollection) return [] as Array<{ folder: string; requests: SavedRequest[] }>;
    const groups = new Map<string, SavedRequest[]>();
    selectedCollection.requests.forEach((req) => {
      const { folder } = requestToPathTag(req.name);
      if (!groups.has(folder)) groups.set(folder, []);
      groups.get(folder)!.push(req);
    });
    return Array.from(groups.entries()).map(([folder, requests]) => ({ folder, requests }));
  }, [selectedCollection]);

  const setCollectionHistory = (collectionId: string, entry: CollectionRunHistoryEntry) => {
    setRunHistory((prev) => {
      const next = {
        ...prev,
        [collectionId]: [entry, ...(prev[collectionId] || [])].slice(0, 5)
      };
      saveRunHistory(next);
      return next;
    });
  };

  const refreshCollections = async () => {
    await queryClient.invalidateQueries({ queryKey: ["collections"] });
  };

  const createCollection = async () => {
    const name = window.prompt("Collection name", "Auth Tests");
    if (!name?.trim()) return;
    await apiPost("/api/collections", { name: name.trim() });
    await refreshCollections();
    setMessage("Collection created.");
  };

  const addRequest = async () => {
    if (!selectedCollection) return;
    const name = window.prompt("Request name", "Folder/New request");
    if (!name?.trim()) return;
    const url = window.prompt("Request URL", "https://api.example.com/health") || "";
    const method = (window.prompt("Method", "GET") || "GET").toUpperCase();
    await apiPost(`/api/collections/${encodeURIComponent(selectedCollection.id)}/requests`, {
      name: name.trim(),
      method,
      url,
      headers: [],
      bodyFormat: "json",
      bodyText: "",
      formFields: [],
      params: [],
      auth: { type: "NONE" }
    });
    await refreshCollections();
    setMessage("Request added.");
  };

  const runRequest = async (collectionId: string, requestId: string) => {
    const res = await apiPost<RunResult>(
      `/api/collections/${encodeURIComponent(collectionId)}/requests/${encodeURIComponent(requestId)}/run`,
      {}
    );
    return res;
  };

  const runCollection = async () => {
    if (!selectedCollection || selectedCollection.requests.length === 0) return;
    setRunningCollection(true);
    setMessage("Running collection...");
    const started = Date.now();
    let passed = 0;
    let failed = 0;

    for (const req of selectedCollection.requests) {
      try {
        const result = await runRequest(selectedCollection.id, req.id);
        if (result.status < 400) passed += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }

    const durationMs = Date.now() - started;
    const total = selectedCollection.requests.length;
    setCollectionHistory(selectedCollection.id, {
      at: new Date().toISOString(),
      passed,
      failed,
      total,
      durationMs
    });

    setRunningCollection(false);
    setMessage(`Collection run complete: ${passed}/${total} passed.`);
  };

  const updateRequestBasics = async () => {
    if (!selectedCollection || !selectedRequest) return;
    const nextName = window.prompt("Request name", selectedRequest.name) || selectedRequest.name;
    const nextMethod = (window.prompt("Method", selectedRequest.method) || selectedRequest.method).toUpperCase();
    const nextUrl = window.prompt("URL", selectedRequest.url) || selectedRequest.url;
    await apiPut(
      `/api/collections/${encodeURIComponent(selectedCollection.id)}/requests/${encodeURIComponent(selectedRequest.id)}`,
      {
        name: nextName,
        method: nextMethod,
        url: nextUrl
      }
    );
    await refreshCollections();
    setMessage("Request updated.");
  };

  const duplicateRequest = async () => {
    if (!selectedCollection || !selectedRequest) return;
    await apiPost(`/api/collections/${encodeURIComponent(selectedCollection.id)}/requests`, {
      ...selectedRequest,
      name: `${selectedRequest.name} Copy`
    });
    await refreshCollections();
    setMessage("Request duplicated.");
  };

  const deleteRequest = async () => {
    if (!selectedCollection || !selectedRequest) return;
    if (!window.confirm(`Delete request ${selectedRequest.name}?`)) return;
    await apiDelete(
      `/api/collections/${encodeURIComponent(selectedCollection.id)}/requests/${encodeURIComponent(selectedRequest.id)}`
    );
    await refreshCollections();
    setMessage("Request deleted.");
  };

  const exportOpenApi = () => {
    if (!selectedCollection) return;
    const yaml = toOpenApiYaml(selectedCollection);
    const blob = new Blob([yaml], { type: "application/x-yaml" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${selectedCollection.name.replace(/\s+/g, "-").toLowerCase() || "collection"}.openapi.yaml`;
    a.click();
    URL.revokeObjectURL(href);
  };

  const shareCollection = async () => {
    if (!selectedCollection) return;
    const payload = JSON.stringify(selectedCollection, null, 2);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload);
    } else {
      window.prompt("Copy collection JSON", payload);
    }
    setMessage("Collection JSON copied.");
  };

  return (
    <section className="collections-grid">
      <aside className="page-card collections-sidebar">
        <div className="collections-side-head">
          <h1>Collections</h1>
          <button type="button" className="shell-btn" onClick={createCollection}>
            +
          </button>
        </div>

        <div className="collections-list">
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              className={`collection-item-btn ${selectedCollection?.id === collection.id ? "is-active" : ""}`}
              onClick={() => {
                setSelectedCollectionId(collection.id);
                setSelectedRequestId("");
              }}
            >
              <strong>{collection.name}</strong>
              <span>{collection.requests.length} requests</span>
            </button>
          ))}
        </div>
      </aside>

      <article className="page-card collections-main">
        {!selectedCollection && <p>No collections yet.</p>}

        {selectedCollection && (
          <>
            <header className="collections-main-head">
              <h1>{selectedCollection.name}</h1>
              <div className="settings-actions-row">
                <button type="button" className="shell-btn" onClick={addRequest}>
                  + Add
                </button>
                <button type="button" className="shell-btn" disabled={runningCollection} onClick={runCollection}>
                  {runningCollection ? "Running..." : "Run Collection"}
                </button>
                <button type="button" className="shell-btn" onClick={exportOpenApi}>
                  Export OpenAPI
                </button>
                <button type="button" className="shell-btn" onClick={shareCollection}>
                  Share
                </button>
              </div>
            </header>

            <div className="collection-requests-layout">
              <div className="collection-requests-tree">
                {groupedRequests.map((group) => {
                  const expanded = folderExpanded[group.folder] ?? true;
                  return (
                    <section key={group.folder} className="collection-folder-block">
                      <button
                        type="button"
                        className="collection-folder-toggle"
                        onClick={() => setFolderExpanded((prev) => ({ ...prev, [group.folder]: !expanded }))}
                      >
                        {expanded ? "▼" : "▶"} {group.folder}
                      </button>
                      {expanded && (
                        <div className="collection-folder-items">
                          {group.requests.map((req) => {
                            const label = requestToPathTag(req.name).label;
                            return (
                              <button
                                key={req.id}
                                type="button"
                                className={`collection-request-btn ${selectedRequest?.id === req.id ? "is-active" : ""}`}
                                onClick={() => setSelectedRequestId(req.id)}
                              >
                                <span className="builder-tab-method">{req.method}</span>
                                <span>{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              <div className="collection-request-detail">
                {!selectedRequest && <p>Select a request.</p>}
                {selectedRequest && (
                  <>
                    <h2>
                      {selectedRequest.name} <span>{selectedRequest.method}</span>
                    </h2>
                    <p className="collection-url" title={selectedRequest.url}>
                      {truncate(selectedRequest.url)}
                    </p>
                    <pre>{selectedRequest.bodyText || "(empty body)"}</pre>
                    <div className="settings-actions-row">
                      <button
                        type="button"
                        className="shell-btn"
                        onClick={async () => {
                          const result = await runRequest(selectedCollection.id, selectedRequest.id);
                          setMessage(`Run complete: ${result.status} (${result.duration_ms}ms)`);
                        }}
                      >
                        Run
                      </button>
                      <button type="button" className="shell-btn" onClick={updateRequestBasics}>
                        Edit
                      </button>
                      <button type="button" className="shell-btn" onClick={duplicateRequest}>
                        Duplicate
                      </button>
                      <button type="button" className="shell-btn" onClick={deleteRequest}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <section className="collection-history-block">
              <h2>Collection Run History (last 5)</h2>
              <div className="collection-history-list">
                {(runHistory[selectedCollection.id] || []).map((entry, idx) => (
                  <article key={`${entry.at}-${idx}`} className="collection-history-item">
                    <strong>{entry.passed}/{entry.total} passed</strong>
                    <span>{entry.failed} failed</span>
                    <span>{entry.durationMs}ms</span>
                    <span>{timeAgo(entry.at)}</span>
                  </article>
                ))}
                {(runHistory[selectedCollection.id] || []).length === 0 && <p>No runs yet.</p>}
              </div>
            </section>
          </>
        )}
      </article>

      <div className="settings-message" aria-live="polite">{message}</div>
    </section>
  );
}

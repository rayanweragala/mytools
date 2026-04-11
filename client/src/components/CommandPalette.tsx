import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../stores/appStore";
import { useEndpoints } from "../hooks/useEndpoints";
import { apiGet } from "../api/client";

interface CollectionRequest {
  id: string;
  name: string;
  method: string;
  url: string;
}

interface CollectionEntry {
  id: string;
  name: string;
  requests: CollectionRequest[];
}

interface CollectionsResponse {
  collections: CollectionEntry[];
}

interface StateLog {
  id: number;
  method: string;
  path: string;
  returnedStatusCode: number;
  endpoint: string;
}

interface StateResponse {
  logs: StateLog[];
}

type CommandItem =
  | { id: string; type: "page"; label: string; subtitle?: string; action: () => void }
  | { id: string; type: "request"; label: string; subtitle?: string; action: () => void }
  | { id: string; type: "endpoint"; label: string; subtitle?: string; action: () => void }
  | { id: string; type: "action"; label: string; subtitle?: string; action: () => void }
  | { id: string; type: "log"; label: string; subtitle?: string; action: () => void }
  | { id: string; type: "collection"; label: string; subtitle?: string; action: () => void };

interface CommandPaletteProps {
  clearLogs: () => void;
  toggleTunnel: () => void;
  newEndpoint: () => void;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  window.prompt("Copy value", value);
}

export function CommandPalette({ clearLogs, toggleTunnel, newEndpoint }: CommandPaletteProps) {
  const navigate = useNavigate();
  const open = useAppStore((s) => s.commandPaletteOpen);
  const openPalette = useAppStore((s) => s.openCommandPalette);
  const closePalette = useAppStore((s) => s.closeCommandPalette);

  const [query, setQuery] = useState("");

  const endpoints = useEndpoints();
  const collections = useQuery({
    queryKey: ["collections", "palette"],
    queryFn: () => apiGet<CollectionsResponse>("/api/collections"),
    staleTime: 10000
  });
  const state = useQuery({
    queryKey: ["state", "palette"],
    queryFn: () => apiGet<StateResponse>("/api/state"),
    staleTime: 5000
  });

  const pageItems: CommandItem[] = useMemo(
    () => [
      { id: "page:/", type: "page", label: "Dashboard", subtitle: "/", action: () => navigate("/") },
      { id: "page:/simulator", type: "page", label: "Simulator", subtitle: "/simulator", action: () => navigate("/simulator") },
      {
        id: "page:/simulator/endpoints",
        type: "page",
        label: "Endpoint Manager",
        subtitle: "/simulator/endpoints",
        action: () => navigate("/simulator/endpoints")
      },
      { id: "page:/builder", type: "page", label: "Builder", subtitle: "/builder", action: () => navigate("/builder") },
      {
        id: "page:/collections",
        type: "page",
        label: "Collections",
        subtitle: "/collections",
        action: () => navigate("/collections")
      },
      { id: "page:/environments", type: "page", label: "Environments", subtitle: "/environments", action: () => navigate("/environments") },
      { id: "page:/history", type: "page", label: "History", subtitle: "/history", action: () => navigate("/history") },
      { id: "page:/docs", type: "page", label: "API Docs", subtitle: "/docs", action: () => navigate("/docs") },
      { id: "page:/settings", type: "page", label: "Settings", subtitle: "/settings", action: () => navigate("/settings") }
    ],
    [navigate]
  );

  const actionItems: CommandItem[] = useMemo(
    () => [
      {
        id: "action:new-endpoint",
        type: "action",
        label: "Create New Endpoint",
        subtitle: "Opens endpoint creation dialog",
        action: () => newEndpoint()
      },
      {
        id: "action:toggle-tunnel",
        type: "action",
        label: "Start / Stop Tunnel",
        subtitle: "Toggle ngrok tunnel",
        action: () => toggleTunnel()
      },
      {
        id: "action:clear-logs",
        type: "action",
        label: "Clear Logs",
        subtitle: "Delete simulator request logs",
        action: () => clearLogs()
      }
    ],
    [clearLogs, newEndpoint, toggleTunnel]
  );

  const endpointItems: CommandItem[] = (endpoints.data?.endpoints || []).map((endpoint) => ({
    id: `endpoint:${endpoint.key}`,
    type: "endpoint",
    label: `Endpoint: ${endpoint.key}`,
    subtitle: endpoint.webhookUrl,
    action: async () => {
      await copyText(`${window.location.origin}${endpoint.webhookUrl}`);
    }
  }));

  const collectionItems: CommandItem[] = (collections.data?.collections || []).map((collection) => ({
    id: `collection:${collection.id}`,
    type: "collection",
    label: `Collection: ${collection.name}`,
    subtitle: `${collection.requests.length} requests`,
    action: () => navigate(`/collections/${collection.id}`)
  }));

  const requestItems: CommandItem[] = (collections.data?.collections || []).flatMap((collection) =>
    (collection.requests || []).map((request) => ({
      id: `request:${request.id}`,
      type: "request" as const,
      label: `${request.method} ${request.name}`,
      subtitle: request.url,
      action: () => navigate("/builder")
    }))
  );

  const logItems: CommandItem[] = (state.data?.logs || []).slice(0, 15).map((log) => ({
    id: `log:${log.id}`,
    type: "log",
    label: `${log.method} ${log.path}`,
    subtitle: `${log.returnedStatusCode} • ${log.endpoint}`,
    action: () => navigate("/history")
  }));

  const allItems = useMemo(
    () => [...pageItems, ...actionItems, ...endpointItems, ...collectionItems, ...requestItems, ...logItems],
    [actionItems, collectionItems, endpointItems, logItems, pageItems, requestItems]
  );

  const fuse = useMemo(
    () =>
      new Fuse(allItems, {
        keys: ["label", "subtitle"],
        threshold: 0.36
      }),
    [allItems]
  );

  const visibleItems = useMemo(() => {
    const text = query.trim();
    if (!text) {
      return allItems.slice(0, 14);
    }
    return fuse.search(text).map((entry) => entry.item).slice(0, 20);
  }, [allItems, fuse, query]);

  return (
    <>
      <button type="button" className="shell-btn" onClick={openPalette}>
        Cmd/Ctrl+K
      </button>

      {open && (
        <div className="overlay" onClick={closePalette} role="presentation">
          <section
            className="palette-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              autoFocus
              className="palette-input"
              placeholder="Search pages, requests, endpoints, actions..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closePalette();
                }
                if (event.key === "Enter" && visibleItems[0]) {
                  visibleItems[0].action();
                  closePalette();
                  setQuery("");
                }
              }}
            />

            <div className="palette-results">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="palette-item"
                  onClick={() => {
                    item.action();
                    closePalette();
                    setQuery("");
                  }}
                >
                  <span className="palette-label">{item.label}</span>
                  {item.subtitle ? <span className="palette-subtitle">{item.subtitle}</span> : null}
                </button>
              ))}
              {visibleItems.length === 0 && <p className="palette-empty">No matches.</p>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { useBuilderStore, ExecuteResult } from "../stores/builderStore";

type ResponseTab = "body" | "headers" | "raw";

interface TabMenuState {
  tabId: string;
  x: number;
  y: number;
}

function prettyJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function rowClass(active: boolean): string {
  return `builder-tab ${active ? "is-active" : ""}`;
}

export function Builder() {
  const tabs = useBuilderStore((s) => s.tabs);
  const activeTabId = useBuilderStore((s) => s.activeTabId);
  const setActiveTab = useBuilderStore((s) => s.setActiveTab);
  const updateActiveTab = useBuilderStore((s) => s.updateActiveTab);
  const addTab = useBuilderStore((s) => s.addTab);
  const closeTab = useBuilderStore((s) => s.closeTab);
  const duplicateTab = useBuilderStore((s) => s.duplicateTab);
  const renameTab = useBuilderStore((s) => s.renameTab);
  const togglePin = useBuilderStore((s) => s.togglePin);
  const closeOtherTabs = useBuilderStore((s) => s.closeOtherTabs);
  const closeAllTabs = useBuilderStore((s) => s.closeAllTabs);

  const [sending, setSending] = useState(false);
  const [responseTab, setResponseTab] = useState<ResponseTab>("body");
  const [tabMenu, setTabMenu] = useState<TabMenuState | null>(null);

  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId) || tabs[0], [activeTabId, tabs]);

  const sendRequest = async () => {
    if (!activeTab) return;
    setSending(true);
    try {
      const res = await fetch("/api/builder/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: activeTab.method,
          url: activeTab.url,
          headers: activeTab.headers,
          body: activeTab.body,
          bodyFormat: activeTab.bodyFormat,
          formFields: activeTab.formFields,
          params: activeTab.params,
          auth: activeTab.auth
        })
      });
      const data = (await res.json()) as ExecuteResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || `Send failed (${res.status})`);
      }
      updateActiveTab({ lastResponse: data, unsaved: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      updateActiveTab({
        lastResponse: {
          status: 0,
          statusText: "Error",
          headers: {},
          body: message,
          duration_ms: 0
        },
        unsaved: false
      });
    } finally {
      setSending(false);
    }
  };

  if (!activeTab) {
    return (
      <section className="page-card">
        <h1>Builder</h1>
        <p>No tabs open.</p>
      </section>
    );
  }

  return (
    <section className="builder-page">
      <article className="page-card builder-card">
        <div className="builder-tabs-wrap">
          <div className="builder-tabs" role="tablist" aria-label="Request tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={rowClass(tab.id === activeTab.id)}
                onClick={() => setActiveTab(tab.id)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setTabMenu({ tabId: tab.id, x: event.clientX, y: event.clientY });
                }}
              >
                <span className="builder-tab-method">{tab.method}</span>
                <span className="builder-tab-label">{tab.label}</span>
                {tab.unsaved && <span className="builder-tab-dot" aria-hidden="true" />}
                {tab.pinned && <span className="builder-tab-pin" aria-hidden="true">•</span>}
                <span
                  className="builder-tab-close"
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    closeTab(tab.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      closeTab(tab.id);
                    }
                  }}
                >
                  ×
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="shell-btn" onClick={() => addTab(`Request ${tabs.length + 1}`)}>
            +
          </button>
        </div>

        <div className="builder-request-line">
          <select
            value={activeTab.method}
            onChange={(event) => updateActiveTab({ method: event.target.value })}
            className="builder-method"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
            <option>OPTIONS</option>
          </select>
          <input
            className="builder-url"
            value={activeTab.url}
            onChange={(event) => updateActiveTab({ url: event.target.value })}
            placeholder="https://api.example.com/v1/resource"
          />
          <button type="button" className="shell-btn" onClick={sendRequest} disabled={sending || !activeTab.url.trim()}>
            {sending ? "Sending..." : "Send"}
          </button>
        </div>

        <div className="builder-editor-wrap">
          <Editor
            height="280px"
            defaultLanguage="json"
            theme="vs-dark"
            value={activeTab.body}
            onChange={(value) => updateActiveTab({ body: value || "" })}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "off",
              wordWrap: "on",
              formatOnPaste: true,
              formatOnType: true,
              scrollBeyondLastLine: false
            }}
          />
        </div>
      </article>

      <article className="page-card builder-response-card">
        <header className="builder-response-head">
          <h1>Response</h1>
          <p>
            {activeTab.lastResponse
              ? `${activeTab.lastResponse.status || "-"} ${activeTab.lastResponse.statusText || ""} • ${
                  activeTab.lastResponse.duration_ms || 0
                }ms`
              : "No response yet"}
          </p>
        </header>

        <div className="response-tabs" role="tablist" aria-label="Response tabs">
          <button
            type="button"
            className={`response-tab ${responseTab === "body" ? "is-active" : ""}`}
            onClick={() => setResponseTab("body")}
          >
            Body
          </button>
          <button
            type="button"
            className={`response-tab ${responseTab === "headers" ? "is-active" : ""}`}
            onClick={() => setResponseTab("headers")}
          >
            Headers
          </button>
          <button
            type="button"
            className={`response-tab ${responseTab === "raw" ? "is-active" : ""}`}
            onClick={() => setResponseTab("raw")}
          >
            Raw
          </button>
        </div>

        {responseTab === "body" && (
          <div className="builder-editor-wrap">
            <Editor
              height="220px"
              defaultLanguage="json"
              theme="vs-dark"
              value={prettyJson(activeTab.lastResponse?.body || "")}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "off",
                wordWrap: "on",
                scrollBeyondLastLine: false
              }}
            />
          </div>
        )}

        {responseTab === "headers" && (
          <div className="response-headers-table">
            {Object.entries(activeTab.lastResponse?.headers || {}).map(([key, value]) => (
              <div key={key} className="response-header-row">
                <strong>{key}</strong>
                <span>{value}</span>
              </div>
            ))}
            {Object.keys(activeTab.lastResponse?.headers || {}).length === 0 && <p>No headers.</p>}
          </div>
        )}

        {responseTab === "raw" && <pre className="response-raw">{activeTab.lastResponse?.body || ""}</pre>}
      </article>

      {tabMenu && (
        <div
          className="builder-tab-menu"
          style={{ left: tabMenu.x, top: tabMenu.y }}
          onMouseLeave={() => setTabMenu(null)}
        >
          <button
            type="button"
            onClick={() => {
              const next = window.prompt("Rename tab", tabs.find((tab) => tab.id === tabMenu.tabId)?.label || "");
              if (next) renameTab(tabMenu.tabId, next);
              setTabMenu(null);
            }}
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => {
              duplicateTab(tabMenu.tabId);
              setTabMenu(null);
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => {
              togglePin(tabMenu.tabId);
              setTabMenu(null);
            }}
          >
            Pin / Unpin
          </button>
          <button
            type="button"
            onClick={() => {
              closeOtherTabs(tabMenu.tabId);
              setTabMenu(null);
            }}
          >
            Close Others
          </button>
          <button
            type="button"
            onClick={() => {
              closeAllTabs();
              setTabMenu(null);
            }}
          >
            Close All
          </button>
        </div>
      )}
    </section>
  );
}

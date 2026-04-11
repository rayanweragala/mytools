import { ReactNode, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { NotificationCenter } from "./NotificationCenter";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { SHORTCUTS } from "../hooks/shortcuts";
import { useAppStore } from "../stores/appStore";

interface AppShellProps {
  children: ReactNode;
}

function normalizeEndpointName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "-");
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const openCommandPalette = useAppStore((s) => s.openCommandPalette);
  const closeCommandPalette = useAppStore((s) => s.closeCommandPalette);
  const openShortcutsHelp = useAppStore((s) => s.openShortcutsHelp);
  const closeShortcutsHelp = useAppStore((s) => s.closeShortcutsHelp);
  const shortcutsHelpOpen = useAppStore((s) => s.shortcutsHelpOpen);

  const clearLogs = async () => {
    await fetch("/api/logs/clear", { method: "POST" });
  };

  const toggleTunnel = async () => {
    const statusRes = await fetch("/api/tunnel/status", { cache: "no-store" });
    if (!statusRes.ok) return;
    const status = await statusRes.json();
    const endpoint = status.active ? "/api/tunnel/stop" : "/api/tunnel/start";
    await fetch(endpoint, { method: "POST" });
  };

  const newEndpoint = async () => {
    const raw = window.prompt("New endpoint name", "payment-webhook");
    if (!raw) return;
    const name = normalizeEndpointName(raw);
    if (!name) return;
    await fetch("/api/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    navigate("/simulator/endpoints");
  };

  const shortcutHandlers = useMemo(
    () => ({
      openCommandPalette,
      clearLogs,
      toggleTunnel,
      newEndpoint,
      goToDashboard: () => navigate("/"),
      goToSimulator: () => navigate("/simulator"),
      goToBuilder: () => navigate("/builder"),
      goToCollections: () => navigate("/collections"),
      goToHistory: () => navigate("/history"),
      goToEnvironments: () => navigate("/environments"),
      showShortcutsHelp: openShortcutsHelp,
      closeAll: () => {
        closeCommandPalette();
        closeShortcutsHelp();
      }
    }),
    [
      clearLogs,
      closeCommandPalette,
      closeShortcutsHelp,
      navigate,
      newEndpoint,
      openCommandPalette,
      openShortcutsHelp,
      toggleTunnel
    ]
  );

  useKeyboardShortcuts(shortcutHandlers);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content-shell">
        <div className="content-topbar">
          <CommandPalette clearLogs={clearLogs} toggleTunnel={toggleTunnel} newEndpoint={newEndpoint} />
          <NotificationCenter />
        </div>
        <div className="page-frame">{children}</div>
      </main>

      {shortcutsHelpOpen && (
        <div className="overlay" onClick={closeShortcutsHelp} role="presentation">
          <section className="shortcuts-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <header className="shortcuts-head">
              <h2>Keyboard Shortcuts</h2>
              <button type="button" className="shell-btn" onClick={closeShortcutsHelp}>
                Close
              </button>
            </header>
            <div className="shortcuts-list">
              {SHORTCUTS.map((shortcut) => (
                <div key={`${shortcut.action}-${shortcut.keys.join("-")}`} className="shortcut-row">
                  <span>{shortcut.label}</span>
                  <code>{shortcut.keys.join("+")}</code>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

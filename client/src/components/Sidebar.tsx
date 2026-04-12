import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../stores/appStore";
import { apiGet } from "../api/client";

const navSections = [
  {
    title: "Main",
    items: [
      { to: "/", label: "Dashboard" },
      { to: "/simulator", label: "Simulator" },
      { to: "/builder", label: "Builder" }
    ]
  },
  {
    title: "Workspace",
    items: [
      { to: "/collections", label: "Collections" },
      { to: "/environments", label: "Environments" },
      { to: "/history", label: "History" }
    ]
  },
  {
    title: "Tools",
    items: [
      { to: "/docs", label: "API Docs" },
      { to: "/settings", label: "Settings" }
    ]
  }
];

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const clientCount = useAppStore((s) => s.clientCount);
  const activeEndpoints = useAppStore((s) => s.activeEndpoints);

  const tunnel = useQuery({
    queryKey: ["sidebar", "tunnel"],
    queryFn: () => apiGet<{ active: boolean; url: string | null }>("/api/tunnel/status"),
    refetchInterval: 6000
  });

  const chaos = useQuery({
    queryKey: ["sidebar", "chaos"],
    queryFn: () => apiGet<{ enabled: boolean; failureRate: number }>("/api/chaos"),
    refetchInterval: 6000
  });

  const features = useQuery({
    queryKey: ["sidebar", "features"],
    queryFn: () =>
      apiGet<{
        aiEnabled: boolean;
        localAiEnabled: boolean;
        geminiEnabled: boolean;
        ngrokEnabled: boolean;
      }>("/api/config/features"),
    refetchInterval: 12000
  });

  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="sidebar-head">
        <strong>mytools</strong>
        <button type="button" className="shell-btn" onClick={toggleSidebar}>
          {collapsed ? ">" : "<"}
        </button>
      </div>
      {navSections.map((section) => (
        <section key={section.title} className="sidebar-section">
          <p className="sidebar-section-title">{section.title}</p>
          <nav className="sidebar-nav" aria-label={section.title}>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? "is-active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </section>
      ))}

      <section className="sidebar-status">
        <p>
          Tunnel: <strong>{tunnel.data?.active ? "ON" : "OFF"}</strong>
        </p>
        <p>
          Chaos: <strong>{chaos.data?.enabled ? `${Math.trunc(chaos.data.failureRate)}%` : "0%"}</strong>
        </p>
        <p>
          AI:{" "}
          <strong>
            {features.data?.localAiEnabled ? "Local AI" : features.data?.geminiEnabled ? "Gemini" : "Disabled"}
          </strong>
        </p>
        <p>
          Sessions: <strong>{clientCount}</strong>
        </p>
        <p>
          Endpoints: <strong>{activeEndpoints.length}</strong>
        </p>
      </section>
    </aside>
  );
}

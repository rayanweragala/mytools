import { NavLink } from "react-router-dom";
import { useAppStore } from "../stores/appStore";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/simulator", label: "Simulator" },
  { to: "/builder", label: "Builder" },
  { to: "/collections", label: "Collections" },
  { to: "/environments", label: "Environments" },
  { to: "/history", label: "History" },
  { to: "/docs", label: "API Docs" },
  { to: "/settings", label: "Settings" }
];

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="sidebar-head">
        <strong>mytools</strong>
        <button type="button" className="shell-btn" onClick={toggleSidebar}>
          {collapsed ? ">" : "<"}
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? "is-active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <section className="sidebar-status">
        <p>Tunnel: OFF</p>
        <p>Chaos: 0%</p>
        <p>AI: Gemini</p>
      </section>
    </aside>
  );
}

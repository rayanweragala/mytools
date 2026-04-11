import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { NotificationCenter } from "./NotificationCenter";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content-shell">
        <div className="content-topbar">
          <CommandPalette />
          <NotificationCenter />
        </div>
        <div className="page-frame">{children}</div>
      </main>
    </div>
  );
}

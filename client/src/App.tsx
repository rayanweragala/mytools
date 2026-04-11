import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Simulator } from "./pages/Simulator";
import { EndpointManager } from "./pages/EndpointManager";
import { Builder } from "./pages/Builder";
import { Collections } from "./pages/Collections";
import { CollectionDetail } from "./pages/CollectionDetail";
import { Environments } from "./pages/Environments";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import { Docs } from "./pages/Docs";

const queryClient = new QueryClient();

export function App() {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mytools_appearance");
      if (!raw) return;
      const appearance = JSON.parse(raw) as {
        theme?: "dark" | "light" | "system";
        accent?: string;
        compact?: boolean;
        fontSize?: "normal" | "large";
      };
      if (appearance.theme) {
        document.documentElement.dataset.theme = appearance.theme;
      }
      if (appearance.fontSize) {
        document.documentElement.dataset.fontSize = appearance.fontSize;
      }
      document.documentElement.dataset.compact = appearance.compact ? "1" : "0";
      if (appearance.accent) {
        document.documentElement.style.setProperty("--accent-primary", appearance.accent);
      }
    } catch {
      // Ignore malformed persisted appearance settings.
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/simulator/endpoints" element={<EndpointManager />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
            <Route path="/environments" element={<Environments />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

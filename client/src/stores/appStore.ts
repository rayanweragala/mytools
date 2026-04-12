import { create } from "zustand";

interface AppStore {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  shortcutsHelpOpen: boolean;
  clientCount: number;
  activeEndpoints: string[];
  toggleSidebar: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  openShortcutsHelp: () => void;
  closeShortcutsHelp: () => void;
  setCollaboration: (payload: { clientCount?: number; activeEndpoints?: string[] }) => void;
}

const SIDEBAR_KEY = "mytools_sidebar_collapsed";

const initialCollapsed =
  typeof window !== "undefined" ? window.localStorage.getItem(SIDEBAR_KEY) === "1" : false;

export const useAppStore = create<AppStore>((set, get) => ({
  sidebarCollapsed: initialCollapsed,
  commandPaletteOpen: false,
  shortcutsHelpOpen: false,
  clientCount: 1,
  activeEndpoints: [],
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
    }
    set({ sidebarCollapsed: next });
  },
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  openShortcutsHelp: () => set({ shortcutsHelpOpen: true }),
  closeShortcutsHelp: () => set({ shortcutsHelpOpen: false }),
  setCollaboration: (payload) =>
    set((state) => ({
      clientCount: typeof payload.clientCount === "number" ? payload.clientCount : state.clientCount,
      activeEndpoints: Array.isArray(payload.activeEndpoints) ? payload.activeEndpoints : state.activeEndpoints
    }))
}));

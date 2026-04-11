import { create } from "zustand";

interface AppStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const SIDEBAR_KEY = "mytools_sidebar_collapsed";

const initialCollapsed =
  typeof window !== "undefined" ? window.localStorage.getItem(SIDEBAR_KEY) === "1" : false;

export const useAppStore = create<AppStore>((set, get) => ({
  sidebarCollapsed: initialCollapsed,
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
    }
    set({ sidebarCollapsed: next });
  }
}));

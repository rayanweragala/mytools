import { create } from "zustand";

interface BuilderTab {
  id: string;
  label: string;
}

interface BuilderStore {
  tabs: BuilderTab[];
  activeTabId: string;
  addTab: (label?: string) => void;
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  tabs: [{ id: "tab-1", label: "Request 1" }],
  activeTabId: "tab-1",
  addTab: (label = "New Request") => {
    const nextId = `tab-${get().tabs.length + 1}`;
    set((state) => ({
      tabs: [...state.tabs, { id: nextId, label }],
      activeTabId: nextId
    }));
  }
}));

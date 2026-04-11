import { create } from "zustand";

export interface KeyValueEnabled {
  key: string;
  value: string;
  enabled: boolean;
}

export type BodyFormat = "json" | "text" | "form";
export type BuilderAuthType = "NONE" | "BEARER" | "API_KEY" | "BASIC";

export interface BuilderAuthPayload {
  type: BuilderAuthType;
  bearerToken?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
  basicUser?: string;
  basicPassword?: string;
}

export interface ExecuteResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration_ms: number;
}

export interface BuilderTab {
  id: string;
  label: string;
  pinned: boolean;
  unsaved: boolean;
  method: string;
  url: string;
  headers: KeyValueEnabled[];
  body: string;
  bodyFormat: BodyFormat;
  formFields: KeyValueEnabled[];
  params: KeyValueEnabled[];
  auth: BuilderAuthPayload;
  lastResponse?: ExecuteResult;
}

interface BuilderStore {
  tabs: BuilderTab[];
  activeTabId: string;
  addTab: (label?: string) => void;
  setActiveTab: (tabId: string) => void;
  updateActiveTab: (patch: Partial<BuilderTab>) => void;
  renameTab: (tabId: string, label: string) => void;
  togglePin: (tabId: string) => void;
  duplicateTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
}

const STORAGE_KEY = "mytools_builder_tabs";

function defaultRow(): KeyValueEnabled {
  return { key: "", value: "", enabled: true };
}

function createTab(label = "New Request", idx = 1): BuilderTab {
  return {
    id: `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    label: label || `Request ${idx}`,
    pinned: false,
    unsaved: false,
    method: "GET",
    url: "",
    headers: [defaultRow()],
    body: "",
    bodyFormat: "json",
    formFields: [defaultRow()],
    params: [defaultRow()],
    auth: { type: "NONE" }
  };
}

function persistTabs(tabs: BuilderTab[], activeTabId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeTabId }));
}

function loadInitialState(): { tabs: BuilderTab[]; activeTabId: string } {
  if (typeof window === "undefined") {
    const fallback = createTab("Request 1", 1);
    return { tabs: [fallback], activeTabId: fallback.id };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fallback = createTab("Request 1", 1);
      return { tabs: [fallback], activeTabId: fallback.id };
    }
    const parsed = JSON.parse(raw) as { tabs?: BuilderTab[]; activeTabId?: string };
    const tabs = Array.isArray(parsed?.tabs) && parsed.tabs.length ? parsed.tabs : [createTab("Request 1", 1)];
    const activeTabId =
      typeof parsed?.activeTabId === "string" && tabs.some((tab) => tab.id === parsed.activeTabId)
        ? parsed.activeTabId
        : tabs[0].id;
    return { tabs, activeTabId };
  } catch {
    const fallback = createTab("Request 1", 1);
    return { tabs: [fallback], activeTabId: fallback.id };
  }
}

const initial = loadInitialState();

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  tabs: initial.tabs,
  activeTabId: initial.activeTabId,
  addTab: (label = "New Request") => {
    const nextId = get().tabs.length + 1;
    const nextTab = createTab(label || `Request ${nextId}`, nextId);
    set((state) => ({
      tabs: [...state.tabs, nextTab],
      activeTabId: nextTab.id
    }));
    const next = get();
    persistTabs(next.tabs, next.activeTabId);
  },
  setActiveTab: (tabId) => {
    if (!get().tabs.some((tab) => tab.id === tabId)) return;
    set({ activeTabId: tabId });
    const next = get();
    persistTabs(next.tabs, next.activeTabId);
  },
  updateActiveTab: (patch) => {
    const active = get().activeTabId;
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === active ? { ...tab, ...patch, unsaved: true } : tab))
    }));
    const next = get();
    persistTabs(next.tabs, next.activeTabId);
  },
  renameTab: (tabId, label) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, label: trimmed } : tab))
    }));
    const next = get();
    persistTabs(next.tabs, next.activeTabId);
  },
  togglePin: (tabId) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, pinned: !tab.pinned } : tab))
    }));
    const next = get();
    persistTabs(next.tabs, next.activeTabId);
  },
  duplicateTab: (tabId) => {
    const source = get().tabs.find((tab) => tab.id === tabId);
    if (!source) return;
    const copy: BuilderTab = {
      ...source,
      id: `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      label: `${source.label} Copy`,
      unsaved: true
    };
    set((state) => ({
      tabs: [...state.tabs, copy],
      activeTabId: copy.id
    }));
    const next = get();
    persistTabs(next.tabs, next.activeTabId);
  },
  closeTab: (tabId) => {
    const tabs = get().tabs;
    if (tabs.length <= 1) return;
    const filtered = tabs.filter((tab) => tab.id !== tabId);
    const currentActive = get().activeTabId;
    const nextActive = currentActive === tabId ? filtered[filtered.length - 1]?.id || filtered[0].id : currentActive;
    set({ tabs: filtered, activeTabId: nextActive });
    const next = get();
    persistTabs(next.tabs, next.activeTabId);
  },
  closeOtherTabs: (tabId) => {
    const keep = get().tabs.find((tab) => tab.id === tabId);
    if (!keep) return;
    set({ tabs: [keep], activeTabId: keep.id });
    const next = get();
    persistTabs(next.tabs, next.activeTabId);
  },
  closeAllTabs: () => {
    const fresh = createTab("Request 1", 1);
    set({ tabs: [fresh], activeTabId: fresh.id });
    const next = get();
    persistTabs(next.tabs, next.activeTabId);
  }
}));

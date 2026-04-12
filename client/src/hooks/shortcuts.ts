export interface ShortcutDef {
  keys: string[];
  action: string;
  label: string;
}

export const SHORTCUTS: ShortcutDef[] = [
  { keys: ["mod", "k"], action: "openCommandPalette", label: "Open Command Palette" },
  { keys: ["ctrl", "p"], action: "openCommandPalette", label: "Open Command Palette" },
  { keys: ["mod", "shift", "c"], action: "clearLogs", label: "Clear Logs" },
  { keys: ["mod", "t"], action: "newBuilderTab", label: "New Builder Tab" },
  { keys: ["mod", "w"], action: "closeActiveTab", label: "Close Tab" },
  { keys: ["mod", "shift", "t"], action: "toggleTunnel", label: "Toggle Tunnel" },
  { keys: ["mod", "shift", "n"], action: "newEndpoint", label: "New Endpoint" },
  { keys: ["g", "d"], action: "goToDashboard", label: "Go to Dashboard" },
  { keys: ["g", "s"], action: "goToSimulator", label: "Go to Simulator" },
  { keys: ["g", "b"], action: "goToBuilder", label: "Go to Builder" },
  { keys: ["g", "c"], action: "goToCollections", label: "Go to Collections" },
  { keys: ["g", "h"], action: "goToHistory", label: "Go to History" },
  { keys: ["g", "e"], action: "goToEnvironments", label: "Go to Environments" },
  { keys: ["?"], action: "showShortcutsHelp", label: "Keyboard Shortcuts" },
  { keys: ["escape"], action: "closeAll", label: "Close Modals/Panels" }
];

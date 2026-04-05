import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logError } from "./log.js";
import { AppState, ChaosConfig, EndpointConfig, EndpointKey, RequestLog, ProfileSnapshot } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../data/config.json");
const MAX_LOGS = 1000;

const defaultEndpointKeys: EndpointKey[] = ["incoming-call", "call-answer", "call-end"];
const defaultChaosConfig: ChaosConfig = { enabled: false, failureRate: 0 };

const defaultEndpointConfig: EndpointConfig = {
  authType: "NONE",
  apiKeyHeaderName: "x-api-key",
  apiKeyValue: "test-api-key-123",
  bearerToken: "test-bearer-token-123",
  defaultStatusCode: 200,
  statusCodes: [],
  responseDelayMs: 0,
  responseBody: JSON.stringify({ status: "ok" }, null, 2),
  responseHeaders: {
    "Content-Type": "application/json"
  },
  forwardUrl: ""
};

class Store {
  private state: AppState;
  private logIdCounter = 1;
  private statusIndices: Record<EndpointKey, number> = {};

  constructor() {
    this.state = this.loadState();
    this.ensureDefaultConfigs();
  }

  private loadState(): AppState {
    if (fs.existsSync(DATA_PATH)) {
      try {
        const raw = fs.readFileSync(DATA_PATH, "utf8");
        const loaded = JSON.parse(raw);
        return {
          configs: loaded.configs || ({} as Record<EndpointKey, EndpointConfig>),
          profiles: Array.isArray(loaded.profiles) ? loaded.profiles : [],
          chaos: loaded.chaos || defaultChaosConfig,
          logs: [], // Clear logs on load for now, or we can keep them
          maxLogs: MAX_LOGS,
          endpointKeys: loaded.endpointKeys || defaultEndpointKeys
        };
      } catch (e) {
        logError("Failed to load state from file, using defaults", e);
      }
    }
    return {
      configs: {} as Record<EndpointKey, EndpointConfig>,
      profiles: [],
      chaos: defaultChaosConfig,
      logs: [],
      maxLogs: MAX_LOGS,
      endpointKeys: defaultEndpointKeys
    };
  }

  private ensureDefaultConfigs() {
    this.state.endpointKeys.forEach((key) => {
      const existing = this.state.configs[key];
      if (!this.state.configs[key]) {
        this.state.configs[key] = {
          ...defaultEndpointConfig,
          responseBody: JSON.stringify({ accepted: true, event: key }, null, 2)
        };
        return;
      }

      this.state.configs[key] = {
        ...defaultEndpointConfig,
        ...existing
      };
    });
  }

  private saveState() {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Only save configs and endpoint keys, not logs
    const toSave = {
      configs: this.state.configs,
      profiles: this.state.profiles,
      chaos: this.state.chaos,
      endpointKeys: this.state.endpointKeys
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(toSave, null, 2), "utf8");
  }

  getState(): AppState {
    return this.state;
  }

  updateConfig(endpoint: EndpointKey, cfg: Partial<EndpointConfig>) {
    if (this.state.configs[endpoint]) {
      this.state.configs[endpoint] = { ...this.state.configs[endpoint], ...cfg };
      this.saveState();
      // Reset sequence index if statusCodes changed
      if (cfg.statusCodes) {
        this.statusIndices[endpoint] = 0;
      }
    }
  }

  resetConfigs() {
    this.state.configs = {} as Record<EndpointKey, EndpointConfig>;
    this.ensureDefaultConfigs();
    this.saveState();
    this.statusIndices = {};
  }

  getProfiles(): ProfileSnapshot[] {
    return this.state.profiles;
  }

  saveProfile(name: string): ProfileSnapshot {
    const baseId = Date.now().toString();
    let profileId = baseId;
    let suffix = 1;
    while (this.state.profiles.some((profile) => profile.id === profileId)) {
      profileId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    const profile: ProfileSnapshot = {
      id: profileId,
      name,
      savedAt: new Date().toISOString(),
      configs: JSON.parse(JSON.stringify(this.state.configs)) as Record<EndpointKey, EndpointConfig>
    };

    this.state.profiles.unshift(profile);
    this.saveState();
    return profile;
  }

  deleteProfile(profileId: string): boolean {
    const before = this.state.profiles.length;
    this.state.profiles = this.state.profiles.filter((profile) => profile.id !== profileId);
    if (this.state.profiles.length === before) {
      return false;
    }
    this.saveState();
    return true;
  }

  loadProfile(profileId: string): boolean {
    const profile = this.state.profiles.find((entry) => entry.id === profileId);
    if (!profile) {
      return false;
    }

    this.state.configs = JSON.parse(JSON.stringify(profile.configs)) as Record<EndpointKey, EndpointConfig>;
    this.ensureDefaultConfigs();
    this.statusIndices = {};
    this.saveState();
    return true;
  }

  getChaos(): ChaosConfig {
    return this.state.chaos;
  }

  updateChaos(config: ChaosConfig): void {
    this.state.chaos = config;
    this.saveState();
  }

  addLog(log: Omit<RequestLog, "id">): number {
    const id = this.logIdCounter++;
    this.state.logs.unshift({ id, ...log });
    if (this.state.logs.length > MAX_LOGS) {
      this.state.logs.length = MAX_LOGS;
    }
    return id;
  }

  clearLogs() {
    this.state.logs = [];
  }

  getLogById(id: number): RequestLog | undefined {
    return this.state.logs.find((entry) => entry.id === id);
  }

  updateLogForwardResult(logId: number, forwardStatus: number | null, forwardError: string | null): void {
    const log = this.state.logs.find((entry) => entry.id === logId);
    if (!log) {
      return;
    }
    log.forwardStatus = forwardStatus;
    log.forwardError = forwardError;
  }

  getNextStatusCode(endpoint: EndpointKey): number {
    const cfg = this.state.configs[endpoint];
    if (!cfg) return 200;

    if (!cfg.statusCodes || cfg.statusCodes.length === 0) {
      return cfg.defaultStatusCode;
    }

    const idx = this.statusIndices[endpoint] || 0;
    const code = cfg.statusCodes[idx];
    this.statusIndices[endpoint] = (idx + 1) % cfg.statusCodes.length;
    return code;
  }
}

export const store = new Store();

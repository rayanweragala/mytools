import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AppState, EndpointConfig, EndpointKey, RequestLog, AuthType } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../data/config.json");
const MAX_LOGS = 1000;

const defaultEndpointKeys: EndpointKey[] = ["incoming-call", "call-answer", "call-end"];

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
  }
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
          ...loaded,
          logs: [], // Clear logs on load for now, or we can keep them
          endpointKeys: loaded.endpointKeys || defaultEndpointKeys
        };
      } catch (e) {
        console.error("Failed to load state from file, using defaults", e);
      }
    }
    return {
      configs: {} as Record<EndpointKey, EndpointConfig>,
      logs: [],
      maxLogs: MAX_LOGS,
      endpointKeys: defaultEndpointKeys
    };
  }

  private ensureDefaultConfigs() {
    this.state.endpointKeys.forEach(key => {
      if (!this.state.configs[key]) {
        this.state.configs[key] = {
          ...defaultEndpointConfig,
          responseBody: JSON.stringify({ accepted: true, event: key }, null, 2)
        };
      }
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

  addLog(log: Omit<RequestLog, "id">) {
    this.state.logs.unshift({ id: this.logIdCounter++, ...log });
    if (this.state.logs.length > MAX_LOGS) {
      this.state.logs.length = MAX_LOGS;
    }
  }

  clearLogs() {
    this.state.logs = [];
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

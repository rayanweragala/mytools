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
const MAX_ENDPOINT_KEY_LENGTH = 64;
const reservedEndpointKeys = new Set(["health", "api"]);

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

const HTTP_STATUS_MIN = 100;
const HTTP_STATUS_MAX = 599;

function isValidHttpStatusCode(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isInteger(value) && value >= HTTP_STATUS_MIN && value <= HTTP_STATUS_MAX
  );
}

function sanitizeResponseHeaders(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...defaultEndpointConfig.responseHeaders };
  }

  const normalized: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = rawKey.trim();
    if (!key || typeof rawValue !== "string") {
      continue;
    }
    normalized[key] = rawValue;
  }

  if (Object.keys(normalized).length === 0) {
    return { ...defaultEndpointConfig.responseHeaders };
  }
  return normalized;
}

function sanitizeEndpointConfigFields(config: EndpointConfig): EndpointConfig {
  return {
    ...config,
    defaultStatusCode: isValidHttpStatusCode(config.defaultStatusCode)
      ? config.defaultStatusCode
      : defaultEndpointConfig.defaultStatusCode,
    statusCodes: Array.isArray(config.statusCodes) ? config.statusCodes.filter((code): code is number => isValidHttpStatusCode(code)) : [],
    responseHeaders: sanitizeResponseHeaders(config.responseHeaders)
  };
}

function endpointDefaultConfig(key: EndpointKey): EndpointConfig {
  return {
    ...defaultEndpointConfig,
    responseBody: JSON.stringify({ accepted: true, event: key }, null, 2)
  };
}

function withSanitizedEndpointConfig(key: EndpointKey, existing?: EndpointConfig): EndpointConfig {
  if (!existing) {
    return endpointDefaultConfig(key);
  }
  return sanitizeEndpointConfigFields({
    ...endpointDefaultConfig(key),
    ...existing
  });
}

function hasOwnProperty(target: unknown, key: string): boolean {
  return Boolean(target) && Object.prototype.hasOwnProperty.call(target, key);
}

function normalizeEndpointName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "-");
}

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
          endpointKeys: Array.isArray(loaded.endpointKeys) && loaded.endpointKeys.length
            ? [...loaded.endpointKeys]
            : [...defaultEndpointKeys]
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
      endpointKeys: [...defaultEndpointKeys]
    };
  }

  private ensureDefaultConfigs() {
    this.state.endpointKeys.forEach((key) => {
      this.state.configs[key] = withSanitizedEndpointConfig(key, this.state.configs[key]);
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

  addEndpoint(key: string): { ok: true; key: string } | { ok: false; error: string } {
    const normalized = normalizeEndpointName(key);
    if (!normalized) {
      return { ok: false, error: "Invalid endpoint name" };
    }
    if (normalized.length > MAX_ENDPOINT_KEY_LENGTH) {
      return { ok: false, error: `Endpoint name too long (max ${MAX_ENDPOINT_KEY_LENGTH} chars)` };
    }
    if (reservedEndpointKeys.has(normalized)) {
      return { ok: false, error: `Endpoint name "${normalized}" is reserved` };
    }
    if (this.state.endpointKeys.includes(normalized)) {
      return { ok: false, error: `Endpoint "${normalized}" already exists` };
    }

    this.state.endpointKeys.push(normalized);
    this.state.configs[normalized] = endpointDefaultConfig(normalized);
    this.saveState();
    return { ok: true, key: normalized };
  }

  renameEndpoint(oldKey: string, newKey: string): { ok: true; key: string } | { ok: false; error: string } {
    const normalizedNew = normalizeEndpointName(newKey);
    if (!this.state.endpointKeys.includes(oldKey)) {
      return { ok: false, error: "Endpoint not found" };
    }
    if (!normalizedNew) {
      return { ok: false, error: "Invalid endpoint name" };
    }
    if (normalizedNew.length > MAX_ENDPOINT_KEY_LENGTH) {
      return { ok: false, error: `Endpoint name too long (max ${MAX_ENDPOINT_KEY_LENGTH} chars)` };
    }
    if (reservedEndpointKeys.has(normalizedNew)) {
      return { ok: false, error: `Endpoint name "${normalizedNew}" is reserved` };
    }
    if (this.state.endpointKeys.includes(normalizedNew) && normalizedNew !== oldKey) {
      return { ok: false, error: "Name already taken" };
    }

    const idx = this.state.endpointKeys.indexOf(oldKey);
    this.state.endpointKeys[idx] = normalizedNew;
    this.state.configs[normalizedNew] = this.state.configs[oldKey];
    delete this.state.configs[oldKey];

    if (hasOwnProperty(this.statusIndices, oldKey)) {
      this.statusIndices[normalizedNew] = this.statusIndices[oldKey];
      delete this.statusIndices[oldKey];
    }

    this.state.logs.forEach((entry) => {
      if (entry.endpoint === oldKey) {
        entry.endpoint = normalizedNew;
      }
    });

    this.saveState();
    return { ok: true, key: normalizedNew };
  }

  deleteEndpoint(key: string): { ok: true } | { ok: false; error: string } {
    if (this.state.endpointKeys.length <= 1) {
      return { ok: false, error: "Cannot delete the last endpoint" };
    }
    if (!this.state.endpointKeys.includes(key)) {
      return { ok: false, error: "Endpoint not found" };
    }

    this.state.endpointKeys = this.state.endpointKeys.filter((entry) => entry !== key);
    delete this.state.configs[key];
    delete this.statusIndices[key];
    this.state.logs = this.state.logs.filter((entry) => entry.endpoint !== key);
    this.saveState();
    return { ok: true };
  }

  duplicateEndpoint(sourceKey: string, newKey: string): { ok: true; key: string } | { ok: false; error: string } {
    if (!this.state.endpointKeys.includes(sourceKey)) {
      return { ok: false, error: "Source endpoint not found" };
    }

    const result = this.addEndpoint(newKey);
    if (!result.ok) {
      return result;
    }

    this.state.configs[result.key] = JSON.parse(JSON.stringify(this.state.configs[sourceKey])) as EndpointConfig;
    this.saveState();
    return result;
  }

  updateConfig(endpoint: EndpointKey, cfg: Partial<EndpointConfig>) {
    if (this.state.configs[endpoint]) {
      this.state.configs[endpoint] = sanitizeEndpointConfigFields({
        ...this.state.configs[endpoint],
        ...cfg
      });
      this.saveState();
      if (hasOwnProperty(cfg, "statusCodes")) {
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

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { EnvironmentRecord, EnvironmentsFile, EnvVariable } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENVIRONMENTS_PATH = path.resolve(__dirname, "../data/environments.json");

const MASK = "***";

function defaultFile(): EnvironmentsFile {
  return { environments: [], activeEnvironmentId: null };
}

function readFile(): EnvironmentsFile {
  if (!fs.existsSync(ENVIRONMENTS_PATH)) {
    return defaultFile();
  }
  try {
    const raw = fs.readFileSync(ENVIRONMENTS_PATH, "utf8");
    const parsed = JSON.parse(raw) as EnvironmentsFile;
    if (!parsed || !Array.isArray(parsed.environments)) {
      return defaultFile();
    }
    return {
      environments: parsed.environments,
      activeEnvironmentId:
        typeof parsed.activeEnvironmentId === "string" || parsed.activeEnvironmentId === null
          ? parsed.activeEnvironmentId
          : null
    };
  } catch {
    return defaultFile();
  }
}

function writeFile(data: EnvironmentsFile): void {
  const dir = path.dirname(ENVIRONMENTS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(ENVIRONMENTS_PATH, JSON.stringify(data, null, 2), "utf8");
}

function newId(): string {
  return `env_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function maskVariables(vars: EnvVariable[]): EnvVariable[] {
  return vars.map((v) => ({
    key: v.key,
    value: v.secret ? MASK : v.value,
    secret: v.secret
  }));
}

export const environmentsStore = {
  getRaw(): EnvironmentsFile {
    return readFile();
  },

  listForApi(): { environments: Array<{ id: string; name: string; variables: EnvVariable[] }>; activeEnvironmentId: string | null } {
    const data = readFile();
    return {
      environments: data.environments.map((e) => ({
        id: e.id,
        name: e.name,
        variables: maskVariables(e.variables || [])
      })),
      activeEnvironmentId: data.activeEnvironmentId
    };
  },

  getByIdForApi(id: string): { id: string; name: string; variables: EnvVariable[] } | null {
    const data = readFile();
    const env = data.environments.find((e) => e.id === id);
    if (!env) {
      return null;
    }
    return {
      id: env.id,
      name: env.name,
      variables: maskVariables(env.variables || [])
    };
  },

  /** Values for substitution (includes secret values). */
  getActiveSubstitutionMap(): Record<string, string> {
    const data = readFile();
    const id = data.activeEnvironmentId;
    if (!id) {
      return {};
    }
    const env = data.environments.find((e) => e.id === id);
    if (!env) {
      return {};
    }
    const map: Record<string, string> = {};
    for (const v of env.variables || []) {
      if (v.key) {
        map[v.key] = v.value;
      }
    }
    return map;
  },

  create(name: string): EnvironmentRecord {
    const data = readFile();
    const record: EnvironmentRecord = {
      id: newId(),
      name: name.trim() || "Environment",
      variables: []
    };
    data.environments.push(record);
    writeFile(data);
    return record;
  },

  delete(id: string): boolean {
    const data = readFile();
    const before = data.environments.length;
    data.environments = data.environments.filter((e) => e.id !== id);
    if (data.environments.length === before) {
      return false;
    }
    if (data.activeEnvironmentId === id) {
      data.activeEnvironmentId = null;
    }
    writeFile(data);
    return true;
  },

  setActive(id: string | null): void {
    const data = readFile();
    if (id !== null && !data.environments.some((e) => e.id === id)) {
      data.activeEnvironmentId = null;
    } else {
      data.activeEnvironmentId = id;
    }
    writeFile(data);
  },

  replaceVariables(
    id: string,
    incoming: Array<{ key: string; value: string; secret: boolean }>
  ): EnvironmentRecord | null {
    const data = readFile();
    const env = data.environments.find((e) => e.id === id);
    if (!env) {
      return null;
    }

    const previousByKey = new Map<string, EnvVariable>();
    for (const v of env.variables || []) {
      previousByKey.set(v.key, v);
    }

    const next: EnvVariable[] = incoming.map((row) => {
      const key = String(row.key || "").trim();
      const prev = previousByKey.get(key);
      let value = String(row.value ?? "");
      let secret = Boolean(row.secret);

      if (prev?.secret && value === MASK) {
        value = prev.value;
        secret = true;
      }

      return { key, value, secret };
    });

    env.variables = next;
    writeFile(data);
    return env;
  }
};

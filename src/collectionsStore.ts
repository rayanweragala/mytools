import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { SavedAuthConfig, SavedRequest } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COLLECTIONS_PATH = path.resolve(__dirname, "../data/collections.json");

export interface CollectionRecord {
  id: string;
  name: string;
  requests: SavedRequest[];
}

export interface CollectionsFile {
  collections: CollectionRecord[];
}

function defaultFile(): CollectionsFile {
  return { collections: [] };
}

function readFile(): CollectionsFile {
  if (!fs.existsSync(COLLECTIONS_PATH)) {
    return defaultFile();
  }
  try {
    const raw = fs.readFileSync(COLLECTIONS_PATH, "utf8");
    const parsed = JSON.parse(raw) as CollectionsFile;
    if (!parsed || !Array.isArray(parsed.collections)) {
      return defaultFile();
    }
    return parsed;
  } catch {
    return defaultFile();
  }
}

function writeFile(data: CollectionsFile): void {
  const dir = path.dirname(COLLECTIONS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(COLLECTIONS_PATH, JSON.stringify(data, null, 2), "utf8");
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export const collectionsStore = {
  getAll(): CollectionRecord[] {
    return readFile().collections;
  },

  create(name: string): CollectionRecord {
    const data = readFile();
    const collection: CollectionRecord = {
      id: newId("col"),
      name: name.trim() || "Untitled",
      requests: []
    };
    data.collections.push(collection);
    writeFile(data);
    return collection;
  },

  delete(id: string): boolean {
    const data = readFile();
    const before = data.collections.length;
    data.collections = data.collections.filter((c) => c.id !== id);
    if (data.collections.length === before) {
      return false;
    }
    writeFile(data);
    return true;
  },

  getById(id: string): CollectionRecord | undefined {
    return readFile().collections.find((c) => c.id === id);
  },

  addRequest(collectionId: string, payload: Omit<SavedRequest, "id">): SavedRequest | null {
    const data = readFile();
    const col = data.collections.find((c) => c.id === collectionId);
    if (!col) {
      return null;
    }
    const req: SavedRequest = {
      ...payload,
      id: newId("req")
    };
    col.requests.push(req);
    writeFile(data);
    return req;
  },

  updateRequest(collectionId: string, requestId: string, patch: Partial<SavedRequest>): SavedRequest | null {
    const data = readFile();
    const col = data.collections.find((c) => c.id === collectionId);
    if (!col) {
      return null;
    }
    const idx = col.requests.findIndex((r) => r.id === requestId);
    if (idx < 0) {
      return null;
    }
    const merged: SavedRequest = { ...col.requests[idx], ...patch, id: requestId };
    col.requests[idx] = merged;
    writeFile(data);
    return merged;
  },

  deleteRequest(collectionId: string, requestId: string): boolean {
    const data = readFile();
    const col = data.collections.find((c) => c.id === collectionId);
    if (!col) {
      return false;
    }
    const before = col.requests.length;
    col.requests = col.requests.filter((r) => r.id !== requestId);
    if (col.requests.length === before) {
      return false;
    }
    writeFile(data);
    return true;
  },

  importCollection(record: { name: string; requests: Omit<SavedRequest, "id">[] }): CollectionRecord {
    const data = readFile();
    const collection: CollectionRecord = {
      id: newId("col"),
      name: record.name?.trim() || "Imported",
      requests: (record.requests || []).map((r) => ({
        ...normalizeImportedRequest(r),
        id: newId("req")
      }))
    };
    data.collections.push(collection);
    writeFile(data);
    return collection;
  }
};

function normalizeImportedRequest(r: Partial<SavedRequest> & Record<string, unknown>): Omit<SavedRequest, "id"> {
  const auth = (r.auth as SavedAuthConfig | undefined) || { type: "NONE" };
  return {
    name: typeof r.name === "string" ? r.name : "Request",
    method: typeof r.method === "string" ? r.method : "GET",
    url: typeof r.url === "string" ? r.url : "",
    headers: Array.isArray(r.headers) ? r.headers : [],
    bodyFormat: r.bodyFormat === "text" || r.bodyFormat === "form" ? r.bodyFormat : "json",
    bodyText: typeof r.bodyText === "string" ? r.bodyText : typeof r.body === "string" ? r.body : "",
    formFields: Array.isArray(r.formFields) ? r.formFields : [],
    params: Array.isArray(r.params) ? r.params : [],
    auth
  };
}

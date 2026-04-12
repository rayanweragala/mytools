export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`GET ${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const method = String(init.method || "GET").toUpperCase();
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json" },
    ...(init.headers || {})
  });
  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

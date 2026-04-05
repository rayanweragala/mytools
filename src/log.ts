/** Structured stderr logging — avoid console.log in request paths. */

export function logWarn(message: string): void {
  console.warn(`[webhooks] ${message}`);
}

export function logError(message: string, detail?: unknown): void {
  if (detail !== undefined) {
    console.error(`[webhooks] ${message}`, detail);
    return;
  }
  console.error(`[webhooks] ${message}`);
}

export function logStartup(message: string): void {
  console.warn(`[webhooks] ${message}`);
}

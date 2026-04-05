/** Structured stderr logging — avoid console.log in request paths. */

export function logWarn(message: string): void {
  console.warn(`[mytools] ${message}`);
}

export function logError(message: string, detail?: unknown): void {
  if (detail !== undefined) {
    console.error(`[mytools] ${message}`, detail);
    return;
  }
  console.error(`[mytools] ${message}`);
}

export function logStartup(message: string): void {
  console.warn(`[mytools] ${message}`);
}

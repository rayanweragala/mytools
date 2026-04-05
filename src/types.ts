export type AuthType = "NONE" | "API_KEY" | "BEARER";
export type EndpointKey = string;

export interface EndpointConfig {
  authType: AuthType;
  apiKeyHeaderName: string;
  apiKeyValue: string;
  bearerToken: string;
  defaultStatusCode: number;
  statusCodes: number[]; // For sequences
  responseDelayMs: number;
  responseBody: string;
  responseHeaders: Record<string, string>;
}

export interface RequestLog {
  id: number;
  endpoint: EndpointKey;
  timestamp: string;
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  rawBody: string;
  authValid: boolean;
  returnedStatusCode: number;
  note: string;
  replayed: boolean;
}

export interface AppState {
  configs: Record<EndpointKey, EndpointConfig>;
  logs: RequestLog[];
  maxLogs: number;
  endpointKeys: EndpointKey[];
}

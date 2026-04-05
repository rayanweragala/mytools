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
  forwardUrl: string;
}

export interface ProfileSnapshot {
  id: string;
  name: string;
  savedAt: string;
  configs: Record<EndpointKey, EndpointConfig>;
}

export interface ChaosConfig {
  enabled: boolean;
  failureRate: number;
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
  forwardStatus: number | null;
  forwardError: string | null;
  note: string;
  replayed: boolean;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  durationMs?: number;
}

export interface AppState {
  configs: Record<EndpointKey, EndpointConfig>;
  profiles: ProfileSnapshot[];
  chaos: ChaosConfig;
  logs: RequestLog[];
  maxLogs: number;
  endpointKeys: EndpointKey[];
}

/** --- Request builder / collections --- */

export interface KeyValueEnabled {
  key: string;
  value: string;
  enabled: boolean;
}

export type BuilderAuthType = "NONE" | "BEARER" | "API_KEY" | "BASIC";

export interface BuilderAuthPayload {
  type: BuilderAuthType;
  bearerToken?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
  basicUser?: string;
  basicPassword?: string;
}

export type BodyFormat = "json" | "text" | "form";

export interface BuilderSendPayload {
  method: string;
  url: string;
  headers: KeyValueEnabled[];
  body: string;
  bodyFormat?: BodyFormat;
  formFields?: KeyValueEnabled[];
  params: KeyValueEnabled[];
  auth?: BuilderAuthPayload;
}

export type SavedAuthConfig = BuilderAuthPayload;

export interface SavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: KeyValueEnabled[];
  bodyFormat: BodyFormat;
  bodyText: string;
  formFields: KeyValueEnabled[];
  params: KeyValueEnabled[];
  auth: SavedAuthConfig;
}

export interface EnvVariable {
  key: string;
  value: string;
  secret: boolean;
}

export interface EnvironmentRecord {
  id: string;
  name: string;
  variables: EnvVariable[];
}

export interface EnvironmentsFile {
  environments: EnvironmentRecord[];
  activeEnvironmentId: string | null;
}

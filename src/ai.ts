import { logWarn } from "./log.js";

export const PAYLOAD_SYSTEM_PROMPT =
  "You are an API testing assistant inside a developer tool called mytools. " +
  "Generate realistic JSON payloads for HTTP requests. " +
  "Return only valid JSON. No explanation. No markdown. No code blocks. " +
  "Just the raw JSON object.";

export const ANALYSIS_SYSTEM_PROMPT =
  "You are an API debugging assistant inside a developer tool called mytools. " +
  "Analyze the provided HTTP request and response briefly and directly. " +
  "Point out anything unusual, errors, or what the response means. " +
  "Be concise — max 4 sentences.";

export const CURL_TO_REQUEST_SYSTEM_PROMPT =
  "You are an API tool assistant. Convert the given curl command into " +
  "a JSON object with these exact fields: " +
  "{ method, url, headers: {}, body: string, params: {} } " +
  "Return only valid JSON. No explanation. No markdown. No code blocks.";

export const REQUEST_TO_CURL_SYSTEM_PROMPT =
  "You are an API tool assistant. Convert the given request object into " +
  "a single curl command string. Include all headers and body. " +
  "Return only the raw curl command string. No explanation. No markdown.";

export interface AiFeatures {
  aiEnabled: boolean;
  localAiEnabled: boolean;
  geminiEnabled: boolean;
}

function getLocalAiBaseUrl(): string | null {
  const raw = process.env.LOCAL_AI_BASE_URL;
  const value = typeof raw === "string" ? raw.trim().replace(/\/+$/, "") : "";
  return value || null;
}

function getLocalAiModel(): string {
  const raw = process.env.LOCAL_AI_MODEL;
  const value = typeof raw === "string" ? raw.trim() : "";
  return value || "mistral:latest";
}

function getGeminiApiKey(): string | null {
  const raw = process.env.GEMINI_API_KEY;
  const value = typeof raw === "string" ? raw.trim() : "";
  return value || null;
}

export function getAiFeatures(): AiFeatures {
  const localAiEnabled = Boolean(getLocalAiBaseUrl());
  const geminiEnabled = Boolean(getGeminiApiKey());
  return {
    aiEnabled: localAiEnabled || geminiEnabled,
    localAiEnabled,
    geminiEnabled
  };
}

export function buildPrompt(systemPrompt: string, ...parts: Array<string | undefined>): string {
  return [systemPrompt, ...parts.filter((part): part is string => Boolean(part && part.trim()))].join("\n\n");
}

export function stripMarkdownCodeFence(input: string): string {
  return input
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export function cleanAiText(input: string): string {
  return stripMarkdownCodeFence(input);
}

export function cleanAiJson<T>(input: string): T | null {
  try {
    return JSON.parse(stripMarkdownCodeFence(input)) as T;
  } catch {
    return null;
  }
}

export async function generateWithLocalAI(prompt: string): Promise<string> {
  const baseUrl = getLocalAiBaseUrl();
  if (!baseUrl) {
    throw new Error("not configured");
  }
  const url = `${baseUrl}/chat`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    console.info(`[mytools] Local AI request URL: ${url}`);
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: getLocalAiModel(),
        messages: [{ role: "user", content: prompt }],
        stream: false
      })
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text();
    console.error(`[mytools] Local AI error response from ${url}: ${text}`);
    throw new Error(text || `Local AI HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new Error("Empty local AI response");
  }
  return text.trim();
}

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  let response: Response;
  try {
    response = await fetch(`${GEMINI_GENERATE_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1000 }
      })
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Gemini HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("Empty Gemini response");
  }
  return text.trim();
}

export async function generate(prompt: string): Promise<string> {
  const features = getAiFeatures();
  if (!features.aiEnabled) {
    throw new Error("AI not configured");
  }

  if (features.localAiEnabled) {
    try {
      return await generateWithLocalAI(prompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logWarn(`Local AI failed, falling through to Gemini: ${message}`);
    }
  }

  if (features.geminiEnabled) {
    return generateWithGemini(prompt);
  }

  throw new Error("All AI providers failed");
}

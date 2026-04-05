import { logWarn } from "./log.js";

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLocalAiBaseUrl(): string | null {
  const raw = process.env.LOCAL_AI_BASE_URL;
  const v = typeof raw === "string" ? raw.trim().replace(/\/+$/, "") : "";
  return v || null;
}

function getLocalAiModel(): string {
  const raw = process.env.LOCAL_AI_MODEL;
  const v = typeof raw === "string" ? raw.trim() : "";
  return v || "mistral:latest";
}

function getGeminiApiKey(): string | null {
  const raw = process.env.GEMINI_API_KEY;
  const v = typeof raw === "string" ? raw.trim() : "";
  return v || null;
}

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

export interface AiFeatures {
  aiEnabled: boolean;
  localAiEnabled: boolean;
  geminiEnabled: boolean;
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

// ---------------------------------------------------------------------------
// Local AI provider
// ---------------------------------------------------------------------------

export async function generateWithLocalAI(prompt: string): Promise<string> {
  const baseUrl = getLocalAiBaseUrl();
  if (!baseUrl) {
    throw new Error("not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: getLocalAiModel(),
        messages: [{ role: "user", content: prompt }]
      })
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Local AI HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new Error("Empty local AI response");
  }
  return text.trim();
}

// ---------------------------------------------------------------------------
// Gemini provider
// ---------------------------------------------------------------------------

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function generateWithGemini(prompt: string): Promise<string> {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error("not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(`${GEMINI_GENERATE_URL}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      })
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Gemini HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("Empty Gemini response");
  }
  return text.trim();
}

// ---------------------------------------------------------------------------
// Unified generate — Local AI first, Gemini fallback
// ---------------------------------------------------------------------------

export async function generate(prompt: string): Promise<string> {
  const baseUrl = getLocalAiBaseUrl();
  const geminiKey = getGeminiApiKey();

  if (!baseUrl && !geminiKey) {
    throw new Error("AI not configured");
  }

  if (baseUrl) {
    try {
      return await generateWithLocalAI(prompt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logWarn(`Local AI failed, falling through to Gemini: ${msg}`);
    }
  }

  if (geminiKey) {
    try {
      return await generateWithGemini(prompt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`All AI providers failed: ${msg}`);
    }
  }

  throw new Error("All AI providers failed");
}

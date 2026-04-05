import { logWarn } from "./log.js";

const MODEL = "gemini-2.0-flash";
const GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

let warnedMissingKey = false;

function apiKey(): string | null {
  const raw = process.env.GEMINI_API_KEY;
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      logWarn("WARNING: GEMINI_API_KEY not set — AI features disabled");
    }
    return null;
  }
  return v;
}

export function isAiConfigured(): boolean {
  return Boolean(apiKey());
}

async function callGemini(systemPrompt: string, userText: string, timeoutMs: number): Promise<string> {
  const key = apiKey();
  if (!key) {
    throw new Error("AI features not configured");
  }

  const fullPrompt = `${systemPrompt}\n\n${userText}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${GENERATE_URL}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
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

export async function generatePayload(prompt: string, context?: string): Promise<{ result: string; error?: string }> {
  if (!apiKey()) {
    return { result: "", error: "AI features not configured" };
  }

  const system =
    "You are an API testing assistant. Generate realistic JSON payloads for HTTP requests. Return only valid JSON, no explanation, no markdown code blocks, no extra text. Just the raw JSON object.";
  const user = context ? `${prompt}\n\nContext: ${context}` : prompt;

  try {
    const text = await callGemini(system, user, 15_000);
    return { result: text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generation failed";
    if (e instanceof Error && e.name === "AbortError") {
      return { result: "", error: "AI request timed out" };
    }
    return { result: "", error: msg };
  }
}

export async function analyzeTraffic(
  requestSummary: string,
  responseSummary: string
): Promise<{ result: string; error?: string }> {
  if (!apiKey()) {
    return { result: "", error: "AI features not configured" };
  }

  const system =
    "You are an API debugging assistant. Analyze this request and response. Be brief and direct. Point out anything unusual, potential issues, or what the response means.";
  const user = `Request:\n${requestSummary}\n\nResponse:\n${responseSummary}`;

  try {
    const text = await callGemini(system, user, 15_000);
    return { result: text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "analysis failed";
    if (e instanceof Error && e.name === "AbortError") {
      return { result: "", error: "AI request timed out" };
    }
    return { result: "", error: msg };
  }
}

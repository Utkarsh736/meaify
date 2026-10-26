/* ============================================================
   Centralised env access. Server-only.
   ------------------------------------------------------------
   Copy .env.example → .env.local and fill in the keys.
   All keys are optional except as noted; missing keys trigger
   graceful fallbacks documented inline below.
   ============================================================ */

function required(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback ?? "";
  if (!v && process.env.NODE_ENV === "production") {
    console.warn(`[env] Missing ${key} — feature will fail in production`);
  }
  return v;
}

export const env = {
  /** Groq free-tier API key. Get one at https://console.groq.com. */
  GROQ_API_KEY: required("GROQ_API_KEY"),
  /** Gemini API key (used as failsafe for OCR & text). */
  GEMINI_API_KEY: required("GEMINI_API_KEY"),
  /** Hugging Face access token (read scope) for embeddings. */
  HF_TOKEN: required("HF_TOKEN"),

  /** Groq vision. Llama 4 Scout left the free tier 2026-08-16; Qwen 3.8 27B is the current vision model. */
  GROQ_VISION_MODEL: process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
  /** llama-3.3-70b-versatile was discontinued for Free/Developer on 2026-08-16. */
  GROQ_TEXT_MODEL: process.env.GROQ_TEXT_MODEL || "openai/gpt-oss-120b",
  GROQ_WHISPER_MODEL: process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo",
  GROQ_EMBEDDING_MODEL: process.env.GROQ_EMBEDDING_MODEL || "",

  /** Stable vision+text failsafe. Override if your key's model list differs. */
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
} as const;

/** True when at least one OCR provider is configured. */
export const hasOcrProvider = (): boolean =>
  Boolean(env.GROQ_API_KEY) || Boolean(env.GEMINI_API_KEY);

/** True when at least one text provider is configured. */
export const hasTextProvider = (): boolean => hasOcrProvider();

/* ============================================================
   Gemini failsafe — used when Groq fails or when the user
   explicitly prefers Gemini for OCR / text generation.
   ------------------------------------------------------------
   Endpoint: Google Generative Language REST API (v1beta).
   No SDK dependency (kept the bundle tiny for edge/serverless).
   ============================================================ */

import { env } from "@/lib/env";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: { message?: string };
}

async function geminiGenerate(
  model: string,
  parts: GeminiPart[],
  opts: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<string> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const url = new URL(
    `${GEMINI_BASE}/models/${model}:generateContent`
  );
  url.searchParams.set("key", apiKey);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts, role: "user" }],
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        maxOutputTokens: opts.maxOutputTokens ?? 2048,
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini failed ${res.status}: ${txt}`);
  }

  const data = (await res.json()) as GeminiResponse;
  if (data.error?.message) throw new Error(data.error.message);
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("") ?? "";
  return text.trim();
}

/** OCR a handwritten answer sheet image (used as Groq failsafe). */
export async function geminiVisionOcr(
  imageBase64: string,
  mimeType = "image/jpeg"
): Promise<string> {
  return geminiGenerate(
    env.GEMINI_MODEL,
    [
      {
        text:
          "You are an OCR engine. Extract ALL handwritten text from this exam answer sheet " +
          "in exact top-to-bottom reading order. Output plain text only. Do not use JSON. " +
          "Keep question numbers (e.g., 21, 25, 27, 28, 29, 30) on their own lines.",
      },
      { inlineData: { mimeType, data: imageBase64 } },
    ],
    { temperature: 0.1, maxOutputTokens: 2048 }
  );
}

/** Generate concise AI feedback (Gemini failsafe). */
export async function geminiFeedback(prompt: string): Promise<string> {
  return geminiGenerate(env.GEMINI_MODEL, [{ text: prompt }], {
    temperature: 0.6,
    maxOutputTokens: 256,
  });
}

/** Chatbot reply (Gemini failsafe). */
export async function geminiChatReply(
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string
): Promise<string> {
  // Gemini has no system role in v1beta — prepend to first user turn.
  const parts: GeminiPart[] = [
    { text: `${systemPrompt}\n\nConversation so far:` },
  ];
  for (const m of history) {
    parts.push({ text: `${m.role}: ${m.content}` });
  }
  parts.push({ text: `user: ${userMessage}` });
  parts.push({ text: "assistant:" });
  return geminiGenerate(env.GEMINI_MODEL, parts, {
    temperature: 0.7,
    maxOutputTokens: 1024,
  });
}

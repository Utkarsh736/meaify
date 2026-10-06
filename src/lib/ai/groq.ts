/* ============================================================
   Groq client — thin wrappers around Groq's OpenAI-compatible
   REST endpoints using native fetch (no SDK dependency).
   ------------------------------------------------------------
   Free tier: https://console.groq.com  →  API Keys
   Models used (override via .env):
     - GROQ_VISION_MODEL  : OCR on handwritten answer sheets
     - GROQ_TEXT_MODEL    : AI feedback + chatbot
     - GROQ_WHISPER_MODEL : audio transcription (voice chat)
   ============================================================ */

import { env } from "@/lib/env";

const GROQ_BASE = "https://api.groq.com/openai/v1";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
}

/** Call Groq chat completion (text or multimodal). */
export async function groqChat(
  messages: GroqMessage[],
  opts: { model?: string; temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model || env.GROQ_TEXT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1024,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Groq chat failed ${res.status}: ${txt}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content?.trim() ?? "";
}

/** OCR a handwritten answer sheet image. */
export async function groqVisionOcr(
  imageBase64: string,
  mimeType = "image/jpeg"
): Promise<string> {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const messages: GroqMessage[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text:
            "You are an OCR engine. Extract ALL handwritten text from this exam answer sheet " +
            "in exact top-to-bottom reading order. Output plain text only. Do not use JSON. " +
            "Keep question numbers (e.g., 21, 25, 27, 28, 29, 30) on their own lines.",
        },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    },
  ];

  return groqChat(messages, {
    model: env.GROQ_VISION_MODEL,
    temperature: 0.1,
    maxTokens: 2048,
  });
}

/** Generate concise AI feedback for one answer (matches Python prompt). */
export async function groqFeedback(
  prompt: string
): Promise<string> {
  return groqChat(
    [{ role: "user", content: prompt }],
    { temperature: 0.6, maxTokens: 256 }
  );
}

/** Chat completion for the rubric assistant chatbot. */
export async function groqChatReply(
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string
): Promise<string> {
  const messages: GroqMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content }) as GroqMessage),
    { role: "user", content: userMessage },
  ];
  return groqChat(messages, { temperature: 0.7, maxTokens: 1024 });
}

/** Transcribe an audio file (WebM/WAV/MP3) using Groq Whisper. */
export async function groqTranscribe(
  audioBase64: string,
  mimeType = "audio/webm"
): Promise<string> {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const blob = Buffer.from(audioBase64, "base64");
  const ext = mimeType.includes("webm")
    ? "webm"
    : mimeType.includes("wav")
    ? "wav"
    : "mp3";

  const form = new FormData();
  form.append("file", new Blob([blob], { type: mimeType }), `audio.${ext}`);
  form.append("model", env.GROQ_WHISPER_MODEL);
  form.append("response_format", "text");

  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Groq whisper failed ${res.status}: ${txt}`);
  }
  // response_format=text → plain-text body
  const text = await res.text();
  return text.trim();
}

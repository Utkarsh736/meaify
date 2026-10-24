/* ============================================================
   OCR orchestration — tries Groq vision first, falls back to
   Gemini if Groq errors out (per user request: "failsafe for gemini").
   ============================================================ */

import { groqVisionOcr } from "./groq";
import { geminiVisionOcr } from "./gemini";
import { env } from "@/lib/env";
import type { OcrResult } from "@/types";

export interface OcrOptions {
  /** Force a specific provider. Defaults to "auto" (Groq → Gemini). */
  provider?: "groq" | "gemini" | "auto";
  mimeType?: string;
}

/**
 * Run OCR with Groq first, then Gemini if Groq errors.
 * Returns the first success.
 */
export async function runOcr(
  imageBase64: string,
  opts: OcrOptions = {}
): Promise<OcrResult> {
  const mimeType = opts.mimeType ?? "image/jpeg";
  const strategy = opts.provider ?? envPreferred();

  const t0 = Date.now();
  if (strategy === "gemini") {
    const text = await geminiVisionOcr(imageBase64, mimeType);
    return { text, latencyMs: Date.now() - t0, provider: "gemini" };
  }
  if (strategy === "groq") {
    const text = await groqVisionOcr(imageBase64, mimeType);
    return { text, latencyMs: Date.now() - t0, provider: "groq" };
  }
  // auto: Groq → Gemini on failure
  try {
    const text = await groqVisionOcr(imageBase64, mimeType);
    return { text, latencyMs: Date.now() - t0, provider: "groq" };
  } catch (e) {
    console.warn("[ocr] Groq failed, falling back to Gemini:", (e as Error).message);
    const text = await geminiVisionOcr(imageBase64, mimeType);
    return { text, latencyMs: Date.now() - t0, provider: "gemini" };
  }
}

function envPreferred(): "groq" | "gemini" | "auto" {
  return "auto";
}

/* OCR orchestration — Groq vision first, Gemini if Groq errors. */

import { groqVisionOcr } from "./groq";
import { geminiVisionOcr } from "./gemini";
import type { OcrResult } from "@/types";

export interface OcrOptions {
  provider?: "groq" | "gemini" | "auto";
  mimeType?: string;
}

let ocrFallbackCount = 0;

export function ocrFallbackTotal(): number {
  return ocrFallbackCount;
}

export async function runOcr(
  imageBase64: string,
  opts: OcrOptions = {}
): Promise<OcrResult> {
  const mimeType = opts.mimeType ?? "image/jpeg";
  const strategy = opts.provider ?? "auto";

  const t0 = Date.now();
  if (strategy === "gemini") {
    const text = await geminiVisionOcr(imageBase64, mimeType);
    return { text, latencyMs: Date.now() - t0, provider: "gemini" };
  }
  if (strategy === "groq") {
    const text = await groqVisionOcr(imageBase64, mimeType);
    return { text, latencyMs: Date.now() - t0, provider: "groq" };
  }
  try {
    const text = await groqVisionOcr(imageBase64, mimeType);
    return { text, latencyMs: Date.now() - t0, provider: "groq" };
  } catch (e) {
    console.warn("[ocr] Groq failed, falling back to Gemini:", (e as Error).message);
    ocrFallbackCount += 1;
    const text = await geminiVisionOcr(imageBase64, mimeType);
    return { text, latencyMs: Date.now() - t0, provider: "gemini" };
  }
}

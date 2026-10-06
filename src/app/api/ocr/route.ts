/* POST /api/ocr
 * Body: { imageBase64: string, mimeType?: string, provider?: "groq"|"gemini"|"auto" }
 * Returns: { text: string, latencyMs: number, provider: "groq"|"gemini" }
 *
 * Runs OCR on a single uploaded image. The grade endpoint
 * also runs OCR internally; use this when you want to preview
 * the raw OCR text before committing to a full grading pass.
 */
import { NextResponse } from "next/server";
import { runOcr } from "@/lib/ai/ocr";
import { hasOcrProvider } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!hasOcrProvider()) {
    return NextResponse.json(
      {
        error:
          "No OCR provider configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env.local.",
      },
      { status: 503 }
    );
  }

  const body = (await req.json()) as {
    imageBase64?: string;
    mimeType?: string;
    provider?: "groq" | "gemini" | "auto";
  };

  if (!body.imageBase64) {
    return NextResponse.json(
      { error: "imageBase64 is required" },
      { status: 400 }
    );
  }

  try {
    const result = await runOcr(body.imageBase64, {
      mimeType: body.mimeType ?? "image/jpeg",
      provider: body.provider ?? "auto",
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}

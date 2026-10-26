/* GET /api/health
   Liveness plus a model-list probe. A process that is up is not the
   same as a configured vision model that the provider still serves.
*/
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { scoringWeights } from "@/lib/grading/weights";
import { allRubricHashes } from "@/lib/rubric/hash";
import { ocrFallbackTotal } from "@/lib/ai/ocr";

export const runtime = "nodejs";

interface Probe {
  configured: boolean;
  reachable: boolean | null;
  missing: string[];
  error?: string;
}

async function probeGroq(): Promise<Probe> {
  const wanted = [env.GROQ_VISION_MODEL, env.GROQ_TEXT_MODEL, env.GROQ_WHISPER_MODEL].filter(Boolean);
  if (!env.GROQ_API_KEY) {
    return { configured: false, reachable: null, missing: wanted };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return {
        configured: true,
        reachable: false,
        missing: wanted,
        error: `models list HTTP ${res.status}`,
      };
    }
    const data = (await res.json()) as { data?: Array<{ id: string }> };
    const ids = new Set((data.data ?? []).map((m) => m.id));
    const missing = wanted.filter((id) => !ids.has(id));
    return { configured: true, reachable: missing.length === 0, missing };
  } catch (e) {
    return {
      configured: true,
      reachable: false,
      missing: wanted,
      error: (e as Error).message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const groq = await probeGroq();
  let rubrics: Record<string, string> = {};
  try {
    rubrics = await allRubricHashes();
  } catch {
    rubrics = {};
  }
  const weights = scoringWeights();
  const geminiConfigured = Boolean(env.GEMINI_API_KEY);
  const usable = groq.reachable === true || geminiConfigured;
  return NextResponse.json({
    ok: usable,
    role: "single-teacher local grader",
    weights,
    ocrFallbackTotal: ocrFallbackTotal(),
    groq: {
      ...groq,
      visionModel: env.GROQ_VISION_MODEL,
      textModel: env.GROQ_TEXT_MODEL,
      whisperModel: env.GROQ_WHISPER_MODEL,
    },
    gemini: {
      configured: geminiConfigured,
      model: env.GEMINI_MODEL,
    },
    rubricSha256: rubrics,
  });
}

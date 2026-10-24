/* POST /api/grade
 * Body: {
 *   imageBase64: string,
 *   mimeType?: string,
 *   rubricSlug: string,
 *   submissionSlug?: string  // file-name stem, auto-generated if missing
 * }
 * Returns: full GradingReport (OCR → segment → evaluate → feedback).
 *
 * This is the main pipeline endpoint — it runs the same flow as the
 * original Colab `process_submission` but in TypeScript and persisted
 * to SQLite via Prisma.
 */
import { NextResponse } from "next/server";
import { runOcr } from "@/lib/ai/ocr";
import { loadRubric, loadRubricQuestions } from "@/lib/rubric/loader";
import { groupByQuestion } from "@/lib/grading/segmenter";
import { evaluateAll } from "@/lib/grading/evaluator";
import { generateFeedback } from "@/lib/ai/feedback";
import { saveGradingReport } from "@/lib/db/queries";
import { hasOcrProvider } from "@/lib/env";
import type { GradingReport, RubricQuestion } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    rubricSlug?: string;
    fileName?: string;
    provider?: "groq" | "gemini" | "auto";
  };

  if (!body.imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }
  if (!body.rubricSlug) {
    return NextResponse.json({ error: "rubricSlug is required" }, { status: 400 });
  }

  try {
    // 1. Load rubric
    const rubric = await loadRubric(body.rubricSlug);
    const questions: RubricQuestion[] = await loadRubricQuestions(body.rubricSlug);

    // 2. OCR (Groq → Gemini failsafe)
    const ocr = await runOcr(body.imageBase64, {
      mimeType: body.mimeType ?? "image/jpeg",
      provider: body.provider ?? "auto",
    });

    if (!ocr.text || ocr.text.includes("Error")) {
      return NextResponse.json(
        { error: "OCR produced no usable text", raw: ocr.text },
        { status: 422 }
      );
    }

    // 3. Segment
    const rubricKeys = Object.keys(rubric.questions);
    const segmented = groupByQuestion(ocr.text, rubricKeys);

    // 4. Evaluate (concurrent — embeddings + keyword match)
    const evaluations = await evaluateAll(segmented, questions);

    // 5. AI feedback (concurrent per question)
    const feedbacks = await Promise.all(
      evaluations.map((e) =>
        generateFeedback({
          question: e.question,
          studentAnswer: e.studentAnswer,
          score: e.suggestedScore,
          maxMarks: e.maxMarks,
          missingKeywords: e.missingKeywords,
        })
      )
    );
    evaluations.forEach((e, i) => (e.feedback = feedbacks[i]));

    // 6. Persist to SQLite
    const submissionSlug =
      body.fileName?.split(".")[0]?.replace(/[^a-z0-9_-]/gi, "-").toLowerCase() ||
      `submission-${Date.now()}`;
    const submission = await saveGradingReport({
      slug: submissionSlug,
      fileName: body.fileName ?? `${submissionSlug}.jpg`,
      imageUrl: `data:${body.mimeType ?? "image/jpeg"};base64,${body.imageBase64.slice(0, 64)}…`,
      rubricSlug: body.rubricSlug,
      ocr,
      segmented,
      evaluations,
    });

    const report: GradingReport = {
      submissionId: submission.id,
      rubricSlug: rubric.slug,
      ocr,
      segmented,
      evaluations,
      totalScore: submission.totalScore,
      totalMax: submission.totalMax,
    };

    return NextResponse.json(report);
  } catch (e) {
    console.error("[/api/grade] error:", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}

/* POST /api/grade
 * Body: { imageBase64, mimeType?, rubricSlug, fileName?, provider? }
 * Pipeline: validate image → OCR → quality gate → segment → score → feedback → persist.
 */
import { NextResponse } from "next/server";
import { runOcr } from "@/lib/ai/ocr";
import { loadRubric, loadRubricQuestions } from "@/lib/rubric/loader";
import { rubricSha256 } from "@/lib/rubric/hash";
import { groupByQuestion } from "@/lib/grading/segmenter";
import { evaluateAll } from "@/lib/grading/evaluator";
import { generateFeedback } from "@/lib/ai/feedback";
import { saveGradingReport } from "@/lib/db/queries";
import { hasOcrProvider } from "@/lib/env";
import { storeUpload, UploadError } from "@/lib/uploads";
import { assessTranscript } from "@/lib/security/untrusted";
import { logStage, requestId } from "@/lib/observability";
import type { GradingReport, RubricQuestion } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const rid = requestId();
  const headers = { "x-request-id": rid };

  if (!hasOcrProvider()) {
    return NextResponse.json(
      {
        error:
          "No OCR provider configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env.local.",
      },
      { status: 503, headers }
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
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400, headers });
  }
  if (!body.rubricSlug) {
    return NextResponse.json({ error: "rubricSlug is required" }, { status: 400, headers });
  }

  try {
    const stored = await storeUpload(body.imageBase64, body.mimeType ?? "image/jpeg");
    logStage(rid, "upload", { bytes: stored.bytes, mime: stored.mimeType });

    const rubric = await loadRubric(body.rubricSlug);
    const questions: RubricQuestion[] = await loadRubricQuestions(body.rubricSlug);
    const sha = await rubricSha256(body.rubricSlug);

    const ocr = await runOcr(body.imageBase64, {
      mimeType: stored.mimeType,
      provider: body.provider ?? "auto",
    });
    logStage(rid, "ocr", {
      provider: ocr.provider,
      latencyMs: ocr.latencyMs,
      chars: ocr.text.length,
    });

    const quality = assessTranscript(ocr.text);
    if (!quality.ok) {
      return NextResponse.json(
        { error: quality.reason, raw: ocr.text },
        { status: 422, headers }
      );
    }

    const rubricKeys = Object.keys(rubric.questions);
    const segmented = groupByQuestion(ocr.text, rubricKeys);
    const evaluations = await evaluateAll(segmented, questions);

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

    const submissionSlug =
      body.fileName?.split(".")[0]?.replace(/[^a-z0-9_-]/gi, "-").toLowerCase() ||
      `submission-${Date.now()}`;
    const submission = await saveGradingReport({
      slug: submissionSlug,
      fileName: body.fileName ?? `${submissionSlug}.jpg`,
      imageUrl: stored.imageUrl,
      rubricSlug: body.rubricSlug,
      rubricSha256: sha,
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

    logStage(rid, "graded", {
      submissionId: submission.id,
      totalScore: submission.totalScore,
      rubricSha256: sha.slice(0, 12),
    });

    return NextResponse.json(report, { headers });
  } catch (e) {
    const status = e instanceof UploadError ? 400 : 500;
    logStage(rid, "error", { status, message: (e as Error).message });
    return NextResponse.json(
      { error: (e as Error).message },
      { status, headers }
    );
  }
}

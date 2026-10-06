/* ============================================================
   Database queries — thin wrappers around Prisma so the API
   routes stay declarative and easy to read.
   ============================================================ */

import { db } from "@/lib/db";
import type { EvaluationResult, OcrResult, SegmentedAnswers } from "@/types";

/** Persist a complete grading report (submission + evaluations). */
export async function saveGradingReport(input: {
  slug: string;
  fileName: string;
  imageUrl: string;
  rubricSlug: string;
  ocr: OcrResult;
  segmented: SegmentedAnswers;
  evaluations: EvaluationResult[];
}) {
  const totalScore = input.evaluations.reduce((s, e) => s + e.suggestedScore, 0);
  const totalMax = input.evaluations.reduce((s, e) => s + e.maxMarks, 0);

  const submission = await db.submission.create({
    data: {
      slug: input.slug,
      fileName: input.fileName,
      imageUrl: input.imageUrl,
      rubricId: input.rubricSlug,
      totalScore,
      totalMax,
      ocrText: input.ocr.text,
      ocrLatency: input.ocr.latencyMs,
      ocrProvider: input.ocr.provider,
      evaluations: {
        create: input.evaluations.map((e) => ({
          questionId: e.questionId,
          questionText: e.question,
          studentAnswer: e.studentAnswer,
          modelAnswer: e.modelAnswer,
          keywords: JSON.stringify(e.keywords),
          maxMarks: e.maxMarks,
          suggestedScore: e.suggestedScore,
          semanticSimilarity: e.semanticSimilarity,
          missingKeywords: JSON.stringify(e.missingKeywords),
          feedback: e.feedback,
        })),
      },
    },
    include: { evaluations: true },
  });

  return submission;
}

/** List recent submissions for the History tab. */
export async function listRecentSubmissions(limit = 25) {
  return db.submission.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { evaluations: { take: 1 } },
  });
}

/** Get one submission with all its evaluations. */
export async function getSubmission(submissionId: string) {
  return db.submission.findUnique({
    where: { id: submissionId },
    include: { evaluations: true },
  });
}

/** Most-recent evaluations for the chatbot context window. */
export async function recentEvaluationsForChat(limit = 6) {
  const subs = await db.submission.findMany({
    take: 1,
    orderBy: { createdAt: "desc" },
    include: { evaluations: true },
  });
  const e = subs[0]?.evaluations ?? [];
  return e
    .slice(0, limit)
    .map((row) => ({
      questionId: row.questionId,
      question: row.questionText,
      score: row.suggestedScore,
      maxMarks: row.maxMarks,
      missingKeywords: JSON.parse(row.missingKeywords || "[]") as string[],
      feedback: row.feedback,
    }));
}

/* POST /api/feedback
 * Body: {
 *   question: string,
 *   studentAnswer: string,
 *   score: number,
 *   maxMarks: number,
 *   missingKeywords: string[],
 * }
 * Returns: { feedback: string }
 *
 * Standalone feedback endpoint (used by the "Re-generate feedback"
 * button in the report card).
 */
import { NextResponse } from "next/server";
import { generateFeedback } from "@/lib/ai/feedback";
import { hasTextProvider } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!hasTextProvider()) {
    return NextResponse.json(
      { error: "No text provider configured." },
      { status: 503 }
    );
  }
  const body = (await req.json()) as {
    question?: string;
    studentAnswer?: string;
    score?: number;
    maxMarks?: number;
    missingKeywords?: string[];
  };
  if (!body.question || !body.studentAnswer || body.maxMarks == null) {
    return NextResponse.json(
      { error: "question, studentAnswer, maxMarks are required" },
      { status: 400 }
    );
  }
  try {
    const feedback = await generateFeedback({
      question: body.question,
      studentAnswer: body.studentAnswer,
      score: body.score ?? 0,
      maxMarks: body.maxMarks,
      missingKeywords: body.missingKeywords ?? [],
    });
    return NextResponse.json({ feedback });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

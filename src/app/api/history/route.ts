/* /api/history
 * GET  → list recent submissions
 * GET  ?id=<id> → get one submission with all evaluations
 *
 * Returns the JSON needed by the History tab and the
 * "view report" detail modal.
 */
import { NextResponse } from "next/server";
import { getSubmission, listRecentSubmissions } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  try {
    if (id) {
      const sub = await getSubmission(id);
      if (!sub) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({
        submission: sub,
        evaluations: sub.evaluations.map((e) => ({
          questionId: e.questionId,
          question: e.questionText,
          studentAnswer: e.studentAnswer,
          modelAnswer: e.modelAnswer,
          keywords: JSON.parse(e.keywords || "[]"),
          maxMarks: e.maxMarks,
          suggestedScore: e.suggestedScore,
          semanticSimilarity: e.semanticSimilarity,
          missingKeywords: JSON.parse(e.missingKeywords || "[]"),
          feedback: e.feedback,
        })),
      });
    }
    const submissions = await listRecentSubmissions();
    return NextResponse.json({ submissions });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

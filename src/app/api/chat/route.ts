/* POST /api/chat
 * Body: {
 *   message: string,
 *   rubricSlug?: string,
 *   history?: Array<{ role: "user"|"assistant", content: string }>,
 * }
 * Returns: { reply: string }
 *
 * Chatbot endpoint — Groq first, Gemini failsafe. The system prompt
 * is built from the latest grading report so the bot can answer
 * student questions about their score.
 */
import { NextResponse } from "next/server";
import { generateChatReply, buildSystemPrompt } from "@/lib/ai/feedback";
import { recentEvaluationsForChat } from "@/lib/db/queries";
import { loadRubric } from "@/lib/rubric/loader";
import { hasTextProvider } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasTextProvider()) {
    return NextResponse.json(
      { error: "No text provider configured." },
      { status: 503 }
    );
  }
  const body = (await req.json()) as {
    message?: string;
    rubricSlug?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };
  if (!body.message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  try {
    let rubricTitle: string | undefined;
    let rubricDescription: string | undefined;
    if (body.rubricSlug) {
      try {
        const r = await loadRubric(body.rubricSlug);
        rubricTitle = r.title;
        rubricDescription = r.description;
      } catch {
        // rubric may not exist; that's fine — chat still works
      }
    }
    const recent = await recentEvaluationsForChat();
    const systemPrompt = buildSystemPrompt({
      rubricTitle,
      rubricDescription,
      recentEvaluations: recent,
    });

    const reply = await generateChatReply({
      systemPrompt,
      history: body.history ?? [],
      userMessage: body.message,
    });

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[/api/chat] error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/* ============================================================
   Feedback generator — builds the feedback prompt (matching
   the original Colab notebook) and calls Groq → Gemini failsafe.
   ============================================================ */

import { groqFeedback, groqChatReply } from "./groq";
import { geminiFeedback, geminiChatReply } from "./gemini";

export interface FeedbackInput {
  question: string;
  studentAnswer: string;
  score: number;
  maxMarks: number;
  missingKeywords: string[];
}

/** Build the feedback prompt — same shape as the Python notebook. */
export function buildFeedbackPrompt(input: FeedbackInput): string {
  const missingStr = input.missingKeywords.length
    ? input.missingKeywords.join(", ")
    : "None";
  return (
    `You are an exam evaluator.\n` +
    `Question: ${input.question}\n` +
    `Student Answer: ${input.studentAnswer}\n` +
    `Score: ${input.score}/${input.maxMarks}\n` +
    `Missing Keywords/Concepts: ${missingStr}\n\n` +
    `Write 2 sentences of constructive feedback directly addressing the student in plain text:`
  );
}

/** Generate feedback — Groq first, Gemini failsafe on error. */
export async function generateFeedback(input: FeedbackInput): Promise<string> {
  const prompt = buildFeedbackPrompt(input);
  try {
    return await groqFeedback(prompt);
  } catch (e) {
    console.warn("[feedback] Groq failed, falling back to Gemini:", (e as Error).message);
    return geminiFeedback(prompt);
  }
}

export interface ChatInput {
  systemPrompt: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
}

/** Chatbot reply — Groq first, Gemini failsafe on error. */
export async function generateChatReply(input: ChatInput): Promise<string> {
  try {
    return await groqChatReply(input.systemPrompt, input.history, input.userMessage);
  } catch (e) {
    console.warn("[chat] Groq failed, falling back to Gemini:", (e as Error).message);
    return geminiChatReply(input.systemPrompt, input.history, input.userMessage);
  }
}

/**
 * Build the rubric-aware system prompt for the chatbot. The chatbot
 * has read-only access to the latest grading report from DB so it can
 * answer student questions about their score.
 */
export function buildSystemPrompt(opts: {
  rubricTitle?: string;
  rubricDescription?: string;
  recentEvaluations?: Array<{
    questionId: string;
    question: string;
    score: number;
    maxMarks: number;
    missingKeywords: string[];
    feedback: string;
  }>;
}): string {
  const rubricPart = opts.rubricTitle
    ? `You are the assistant for the rubric "${opts.rubricTitle}". ${opts.rubricDescription ?? ""}`
    : "You are the rubric assistant for the AI grading system.";

  let evalsPart = "";
  if (opts.recentEvaluations?.length) {
    evalsPart =
      "\n\nHere are the most recent graded answers you can refer to:\n" +
      opts.recentEvaluations
        .map(
          (e) =>
            `- Q${e.questionId}: ${e.question} (Score ${e.score}/${e.maxMarks}, missing: ${e.missingKeywords.join(", ") || "none"})\n  Feedback: ${e.feedback}`
        )
        .join("\n");
  }

  return (
    `${rubricPart}\n\n` +
    `Your job is to help students understand their grading and rubric better. ` +
    `Keep answers concise (2-4 sentences). Be encouraging and pedagogical. ` +
    `If a student asks about a specific question, use the evaluations below.${evalsPart}`
  );
}

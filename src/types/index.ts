/* ============================================================
   Shared types for the AI Grading pipeline.
   Kept here (not under /lib) so they are easy to import from
   both server and client code.
   ============================================================ */

/** A single rubric question definition. */
export interface RubricQuestion {
  questionId: string;
  question: string;
  modelAnswer: string;
  keywords: string[];
  maxMarks: number;
}

/** A complete rubric file (loaded from /rubrics/*.json). */
export interface Rubric {
  slug: string;
  title: string;
  description: string;
  questions: Record<string, Omit<RubricQuestion, "questionId">>;
}

/** Raw OCR result returned by a vision model. */
export interface OcrResult {
  text: string;
  latencyMs: number;
  provider: "groq" | "gemini";
}

/** Segmented student answers, keyed by question id. */
export type SegmentedAnswers = Record<string, string>;

/** Per-question evaluation outcome (matches Python `evaluate_answer`). */
export interface EvaluationResult {
  questionId: string;
  studentAnswer: string;
  question: string;
  modelAnswer: string;
  keywords: string[];
  missingKeywords: string[];
  foundKeywords: string[];
  semanticSimilarity: number;
  keywordScore: number;
  maxMarks: number;
  suggestedScore: number;
  feedback: string;
}

/** Full grading report returned by /api/grade. */
export interface GradingReport {
  submissionId: string;
  rubricSlug: string;
  ocr: OcrResult;
  segmented: SegmentedAnswers;
  evaluations: EvaluationResult[];
  totalScore: number;
  totalMax: number;
}

/** Chatbot message shape. */
export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  createdAt: string;
}

/** User settings (persisted to DB or local). */
export interface AppSettings {
  defaultRubric: string;
  preferredOcrProvider: "groq" | "gemini" | "auto";
  ttsEnabled: boolean;
  ttsVoiceURI?: string;
  ttsRate: number;
  chatModel: string;
}

/** Result of a rubric validation pass. */
export interface RubricValidation {
  ok: boolean;
  errors: string[];
  warning?: string;
}

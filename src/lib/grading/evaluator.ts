/* ============================================================
   Evaluator — TypeScript port of the Python `evaluate_answer`.
   Hybrid scoring: 0.6 × semantic_similarity + 0.4 × keyword_match
   (with the keyword match made stem-tolerant via Porter stemmer).
   ============================================================ */

import { cosineSimilarity } from "./similarity";
import { matchKeywords } from "./keywords";
import { hybridFraction, marksFromFraction } from "./weights";
import { embedText } from "@/lib/ai/embeddings";
import type { RubricQuestion } from "@/types";

export interface EvalInput {
  studentAnswer: string;
  question: RubricQuestion;
}

export interface EvalOutput {
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

/**
 * Mirrors the Python hybrid scorer exactly:
 *
 *   sem_sim  = cosine(embed(student), embed(model))
 *   found    = [kw for kw in keywords if stem(kw) in stem(student)]
 *   kw_score = len(found) / len(keywords)
 *   final    = (0.6 * max(0, sem_sim) + 0.4 * kw_score) * max_marks
 *   final    = min(final, max_marks)
 *
 * The embedding call is awaited here so the caller can fan-out
 * concurrently with `Promise.all`.
 */
export async function evaluateAnswer(input: EvalInput): Promise<EvalOutput> {
  const { studentAnswer, question } = input;

  // Empty answer → 0 marks, all keywords missing
  if (!studentAnswer.trim()) {
    return {
      questionId: question.questionId,
      studentAnswer,
      question: question.question,
      modelAnswer: question.modelAnswer,
      keywords: question.keywords,
      missingKeywords: [...question.keywords],
      foundKeywords: [],
      semanticSimilarity: 0,
      keywordScore: 0,
      maxMarks: question.maxMarks,
      suggestedScore: 0,
      feedback: "",
    };
  }

  // Embed both answers in parallel
  const [embStudent, embModel] = await Promise.all([
    embedText(studentAnswer),
    embedText(question.modelAnswer),
  ]);
  const semanticSimilarity = cosineSimilarity(embStudent, embModel);
  const kw = matchKeywords(studentAnswer, question.keywords);
  const suggestedScore = marksFromFraction(
    hybridFraction(semanticSimilarity, kw.score),
    question.maxMarks
  );

  return {
    questionId: question.questionId,
    studentAnswer,
    question: question.question,
    modelAnswer: question.modelAnswer,
    keywords: question.keywords,
    missingKeywords: kw.missing,
    foundKeywords: kw.found,
    semanticSimilarity,
    keywordScore: kw.score,
    maxMarks: question.maxMarks,
    suggestedScore,
    feedback: "",
  };
}

/** Run evaluations concurrently across all questions in a rubric. */
export async function evaluateAll(
  answers: Record<string, string>,
  questions: RubricQuestion[]
): Promise<EvalOutput[]> {
  const inputs = questions.map((q) => ({
    question: q,
    studentAnswer: answers[q.questionId] ?? "",
  }));
  return Promise.all(inputs.map(evaluateAnswer));
}

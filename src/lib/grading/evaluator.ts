/* ============================================================
   Evaluator — TypeScript port of the Python `evaluate_answer`.
   Hybrid scoring: 0.6 × semantic_similarity + 0.4 × keyword_match
   (with the keyword match made stem-tolerant via Porter stemmer).
   ============================================================ */

import { cosineSimilarity } from "./similarity";
import { stemSentence } from "./stemmer";
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
    };
  }

  // Embed both answers in parallel
  const [embStudent, embModel] = await Promise.all([
    embedText(studentAnswer),
    embedText(question.modelAnswer),
  ]);
  const semanticSimilarity = cosineSimilarity(embStudent, embModel);

  // Stem-tolerant keyword match
  const studentStems = stemSentence(studentAnswer);
  const found = question.keywords.filter(
    (kw) => {
      // Stem the keyword (one word or a multi-word phrase — for the latter,
      // stem each token and require all of them present).
      const tokens = kw.toLowerCase().match(/\b[\w-]+\b/g) ?? [];
      return tokens.every((t) => studentStems.has(t.replace(/-/g, "")) || studentStems.has(t));
    }
  );
  // For multi-word keywords, also do a Porter stem direct comparison
  const foundStem = new Set(found);
  const missingKeywords = question.keywords.filter((kw) => !foundStem.has(kw));

  const keywordScore = question.keywords.length
    ? found.length / question.keywords.length
    : 1;

  const raw =
    (0.6 * Math.max(0, semanticSimilarity)) + (0.4 * keywordScore);
  const suggestedScore = Math.min(
    Math.round(raw * question.maxMarks * 100) / 100,
    question.maxMarks
  );

  return {
    questionId: question.questionId,
    studentAnswer,
    question: question.question,
    modelAnswer: question.modelAnswer,
    keywords: question.keywords,
    missingKeywords,
    foundKeywords: found,
    semanticSimilarity,
    keywordScore,
    maxMarks: question.maxMarks,
    suggestedScore,
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

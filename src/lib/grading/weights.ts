/* Hybrid score weights.
   Defaults stay 0.6 semantic / 0.4 keyword until a labeled sweep
   replaces them. Override with SCORE_SEMANTIC_WEIGHT and
   SCORE_KEYWORD_WEIGHT (they are renormalised if they don't sum to 1).
*/

export const DEFAULT_SEMANTIC_WEIGHT = 0.6;
export const DEFAULT_KEYWORD_WEIGHT = 0.4;

export function scoringWeights(): { semantic: number; keyword: number } {
  const semantic = num(process.env.SCORE_SEMANTIC_WEIGHT, DEFAULT_SEMANTIC_WEIGHT);
  const keyword = num(process.env.SCORE_KEYWORD_WEIGHT, DEFAULT_KEYWORD_WEIGHT);
  const sum = semantic + keyword;
  if (sum <= 0) {
    return { semantic: DEFAULT_SEMANTIC_WEIGHT, keyword: DEFAULT_KEYWORD_WEIGHT };
  }
  return { semantic: semantic / sum, keyword: keyword / sum };
}

function num(raw: string | undefined, fallback: number): number {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Unweighted mix in [0, 1] before multiplying by max marks. */
export function hybridFraction(
  semanticSimilarity: number,
  keywordScore: number,
  weights = scoringWeights()
): number {
  const sem = Math.max(0, semanticSimilarity);
  const kw = Math.min(1, Math.max(0, keywordScore));
  return weights.semantic * sem + weights.keyword * kw;
}

export function marksFromFraction(fraction: number, maxMarks: number): number {
  const capped = Math.min(Math.max(0, fraction), 1);
  return Math.min(Math.round(capped * maxMarks * 100) / 100, maxMarks);
}

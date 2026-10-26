import { stemSentence } from "./stemmer";

/** Stem-tolerant keyword hit. A multi-word keyword matches only if every token is present. */
export function matchKeywords(studentAnswer: string, keywords: string[]): {
  found: string[];
  missing: string[];
  score: number;
} {
  if (!keywords.length) return { found: [], missing: [], score: 1 };
  const studentStems = stemSentence(studentAnswer);
  const found = keywords.filter((kw) => {
    const tokens = kw.toLowerCase().match(/\b[\w-]+\b/g) ?? [];
    return tokens.every(
      (t) => studentStems.has(t.replace(/-/g, "")) || studentStems.has(t)
    );
  });
  const foundSet = new Set(found);
  const missing = keywords.filter((kw) => !foundSet.has(kw));
  return {
    found,
    missing,
    score: found.length / keywords.length,
  };
}

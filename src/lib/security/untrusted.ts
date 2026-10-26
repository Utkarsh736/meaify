/* Student writing (OCR or typed) is data, never instructions.
   Strip common prompt-injection / score-gaming phrases before they
   reach a model prompt. Scoring still sees the original answer so a
   stuffed keyword list is judged by the hybrid scorer, not deleted.
*/

const INJECTION =
  /\b(?:ignore|disregard|forget)\b[^.\n]{0,80}\b(?:instructions?|rubric|prompt|rules)\b|\b(?:system|assistant|developer)\s*:|\baward\s+full\s+marks\b|\byou\s+are\s+now\b|\bact\s+as\b/gi;

export function neutralizeForPrompt(text: string): string {
  return text.replace(INJECTION, "[redacted]");
}

/** Cheap transcript sanity check. Does not call a model. */
export function assessTranscript(text: string): { ok: boolean; reason?: string } {
  const t = text.trim();
  if (t.length < 12) return { ok: false, reason: "transcript too short to grade" };
  if (/^(i('| a)?m sorry|i cannot|i can't|unable to|as an ai)/i.test(t)) {
    return { ok: false, reason: "vision model refused or returned a non-transcript" };
  }
  const letters = (t.match(/[a-z]/gi) ?? []).length;
  if (letters < 8) return { ok: false, reason: "transcript has almost no letters" };
  return { ok: true };
}

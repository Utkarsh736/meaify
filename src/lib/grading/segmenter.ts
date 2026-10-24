/* ============================================================
   Segmenter — TypeScript port of `group_by_question` from the
   original Colab notebook. Given raw OCR text and a list of rubric
   question keys, returns a dict mapping question id → student answer.
   ============================================================ */

import type { SegmentedAnswers } from "@/types";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Splits raw OCR transcript into per-question chunks.
 *
 * Mirrors the Python logic exactly:
 *   1. Build a regex that matches `Q? <question-key>` or `<key>:` at start of a line.
 *   2. Walk the transcript line by line, opening a new bucket when a key is matched.
 *   3. Anything after the key stays in that bucket.
 *   4. Lines after the key (until the next key) are appended.
 */
export function groupByQuestion(
  rawText: string,
  rubricKeys: string[]
): SegmentedAnswers {
  if (!rubricKeys.length) return {};

  // Sort keys longest-first so '25' doesn't shadow '250'.
  const sortedKeys = [...rubricKeys].sort((a, b) => b.length - a.length);
  const keyPattern = sortedKeys.map(escapeRegExp).join("|");

  // ^(?:Q(?:uestion)?\.?\s*)?(<keys>)(?:[\.\):]|\s)
  const Q_REGEX = new RegExp(
    `^(?:Q(?:uestion)?\\.?\\s*)?(${keyPattern})(?:[.\\):]|\\s)`,
    "i"
  );

  const grouped: Record<string, string> = {};
  let currentQ: string | null = null;

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(Q_REGEX);
    if (match) {
      currentQ = match[1];
      grouped[currentQ] = "";
      const remainder = line.replace(Q_REGEX, "").trim();
      if (remainder) grouped[currentQ] += remainder + " ";
    } else if (currentQ) {
      grouped[currentQ] += line + " ";
    }
  }

  // Strip trailing whitespace from each chunk
  const out: SegmentedAnswers = {};
  for (const [k, v] of Object.entries(grouped)) {
    out[k] = v.trim();
  }
  return out;
}

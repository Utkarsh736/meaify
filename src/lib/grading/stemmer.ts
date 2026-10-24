/* ============================================================
   Porter Stemmer — TypeScript port of NLTK's PorterStemmer.
   Faithful port of Martin Porter's algorithm
   (https://snowballstem.org/algorithms/porter/stemmer.html).
   Used by the keyword-match scorer so that 'predicted', 'predict',
   'predicts' all reduce to the same stem, exactly like the original
   Colab notebook used `nltk.stem.PorterStemmer`.
   ============================================================ */

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

function isConsonant(word: string, i: number): boolean {
  const c = word[i];
  if (c === "y") {
    if (i === 0) return true;
    return !isConsonant(word, i - 1);
  }
  return !VOWELS.has(c);
}

/** Measure: count of VC sequences in a word. */
function measure(stem: string): number {
  let m = 0;
  let prev = "c"; // pretend we ended on a consonant
  for (let i = 0; i < stem.length; i++) {
    const cur = isConsonant(stem, i) ? "c" : "v";
    if (prev === "v" && cur === "c") m++;
    prev = cur;
  }
  return m;
}

/** *v* — stem contains a vowel. */
function containsVowel(stem: string): boolean {
  for (let i = 0; i < stem.length; i++) {
    if (!isConsonant(stem, i)) return true;
  }
  return false;
}

/** *d — stem ends with double consonant. */
function endsDoubleConsonant(stem: string): boolean {
  if (stem.length < 2) return false;
  if (stem[stem.length - 1] !== stem[stem.length - 2]) return false;
  return isConsonant(stem, stem.length - 1);
}

/** *o — stem ends cvc, second-to-last not in {w, x, y}. */
function endsCvc(stem: string): boolean {
  if (stem.length < 3) return false;
  if (
    !isConsonant(stem, stem.length - 3) ||
    isConsonant(stem, stem.length - 2) ||
    !isConsonant(stem, stem.length - 1)
  ) {
    return false;
  }
  const last = stem[stem.length - 1];
  return last !== "w" && last !== "x" && last !== "y";
}

function endsWith(stem: string, suffix: string): boolean {
  return stem.length >= suffix.length &&
    stem.slice(stem.length - suffix.length) === suffix;
}

function replaceSuffix(stem: string, suffix: string, replacement: string): string {
  return stem.slice(0, stem.length - suffix.length) + replacement;
}

/** Step 1a — plural & s-es. */
function step1a(word: string): string {
  if (endsWith(word, "sses")) return word.slice(0, -2); // sses -> ss
  if (endsWith(word, "ies")) return word.slice(0, -2);  // ies  -> i
  if (endsWith(word, "ss")) return word;
  if (endsWith(word, "s") && !endsWith(word, "us") && !endsWith(word, "ss")) {
    return word.slice(0, -1);
  }
  return word;
}

/** Step 1b — ed/ing. */
function step1b(word: string): string {
  if (endsWith(word, "eed")) {
    const stem = word.slice(0, -3);
    if (measure(stem) > 0) return stem + "ee";
    return word;
  }
  if (endsWith(word, "ed")) {
    const stem = word.slice(0, -2);
    if (containsVowel(stem)) return step1bPost(stem);
  }
  if (endsWith(word, "ing")) {
    const stem = word.slice(0, -3);
    if (containsVowel(stem)) return step1bPost(stem);
  }
  return word;
}

function step1bPost(stem: string): string {
  if (endsWith(stem, "at") || endsWith(stem, "bl") || endsWith(stem, "iz")) {
    return stem + "e";
  }
  if (endsDoubleConsonant(stem) && !endsWith(stem, "l") &&
      !endsWith(stem, "s") && !endsWith(stem, "z")) {
    return stem.slice(0, -1);
  }
  if (measure(stem) === 1 && endsCvc(stem)) {
    return stem + "e";
  }
  return stem;
}

/** Step 1c — y → i. */
function step1c(word: string): string {
  if (endsWith(word, "y")) {
    const stem = word.slice(0, -1);
    if (containsVowel(stem)) return stem + "i";
  }
  return word;
}

/** Step 2 — common derivational suffixes. */
function step2(word: string): string {
  const rules: Array<[string, string, string]> = [
    ["ational", "ate", "ate"],
    ["tional", "tion", ""],
    ["enci", "ence", "ence"],
    ["anci", "ance", "ance"],
    ["izer", "ize", "ize"],
    ["abli", "able", "able"],
    ["alli", "al", "al"],
    ["entli", "ent", "ent"],
    ["eli", "e", "e"],
    ["ousli", "ous", "ous"],
    ["ization", "ize", "ize"],
    ["ation", "ate", "ate"],
    ["ator", "ate", "ate"],
    ["alism", "al", "al"],
    ["iveness", "ive", "ive"],
    ["fulness", "ful", "ful"],
    ["ousness", "ous", "ous"],
    ["aliti", "al", "al"],
    ["iviti", "ive", "ive"],
    ["biliti", "ble", "ble"],
  ];
  for (const [suffix, _stemEnd, replacement] of rules) {
    if (endsWith(word, suffix)) {
      const stem = word.slice(0, word.length - suffix.length);
      if (measure(stem) > 0) return stem + replacement;
      break;
    }
  }
  return word;
}

/** Step 3. */
function step3(word: string): string {
  const rules: Array<[string, string]> = [
    ["icate", "ic"],
    ["ative", ""],
    ["alize", "al"],
    ["iciti", "ic"],
    ["ical", "ic"],
    ["ful", ""],
    ["ness", ""],
  ];
  for (const [suffix, replacement] of rules) {
    if (endsWith(word, suffix)) {
      const stem = word.slice(0, word.length - suffix.length);
      if (measure(stem) > 0) return stem + replacement;
      break;
    }
  }
  return word;
}

/** Step 4. */
function step4(word: string): string {
  const suffixes = [
    "al", "ance", "ence", "er", "ic", "able", "ible", "ant",
    "ement", "ment", "ent", "ou", "ism", "ate", "iti", "ous", "ive", "ize",
  ];
  for (const s of suffixes) {
    if (endsWith(word, s)) {
      const stem = word.slice(0, word.length - s.length);
      if (measure(stem) > 1) return stem;
      return word;
    }
  }
  // special handling: ion
  if (endsWith(word, "ion")) {
    const stem = word.slice(0, -3);
    if (measure(stem) > 1 && (endsWith(stem, "s") || endsWith(stem, "t"))) {
      return stem;
    }
  }
  return word;
}

/** Step 5a. */
function step5a(word: string): string {
  if (endsWith(word, "e")) {
    const stem = word.slice(0, -1);
    const m = measure(stem);
    if (m > 1) return stem;
    if (m === 1 && !endsCvc(stem)) return stem;
  }
  return word;
}

/** Step 5b. */
function step5b(word: string): string {
  if (measure(word) > 1 && endsDoubleConsonant(word) && endsWith(word, "l")) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Public API — reduces an English word to its Porter stem.
 * Lowercases the input first to match NLTK behaviour.
 */
export function porterStem(word: string): string {
  if (!word) return "";
  const w = word.toLowerCase();
  if (w.length <= 2) return w;
  let result = w;
  result = step1a(result);
  result = step1b(result);
  result = step1c(result);
  result = step2(result);
  result = step3(result);
  result = step4(result);
  result = step5a(result);
  result = step5b(result);
  return result;
}

/** Stem an array of words. Useful for the keyword scorer. */
export function stemWords(words: string[]): string[] {
  return words.map((w) => porterStem(w));
}

/** Stem a sentence → Set of stems (used in evaluator). */
export function stemSentence(text: string): Set<string> {
  const tokens = text.toLowerCase().match(/\b\w+\b/g) ?? [];
  return new Set(tokens.map((t) => porterStem(t)));
}

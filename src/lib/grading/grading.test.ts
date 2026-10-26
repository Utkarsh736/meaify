import { describe, expect, it } from "vitest";
import { cosineSimilarity } from "./similarity";
import { groupByQuestion } from "./segmenter";
import { matchKeywords } from "./keywords";
import { hybridFraction, marksFromFraction } from "./weights";
import { stemSentence } from "./stemmer";

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors and 0 for empty", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1], [1, 0])).toBe(0);
  });
});

describe("stemmer", () => {
  it("folds predict/predicted", () => {
    const stems = stemSentence("The model predicted the class");
    expect(stems.has("predict")).toBe(true);
  });
});

describe("segmenter", () => {
  it("splits numbered answers and ignores preamble", () => {
    const text = "Name: Ada\n25 Machine learning predicts patterns\n27 Use a boxplot";
    const grouped = groupByQuestion(text, ["25", "27"]);
    expect(grouped["25"]).toMatch(/machine learning/i);
    expect(grouped["27"]).toMatch(/boxplot/i);
    expect(Object.keys(grouped)).toEqual(["25", "27"]);
  });
});

describe("hybrid score", () => {
  const weights = { semantic: 0.6, keyword: 0.4 };

  it("blank-equivalent components score 0", () => {
    expect(marksFromFraction(hybridFraction(0, 0, weights), 5)).toBe(0);
  });

  it("keyword stuffing without semantics cannot take full marks", () => {
    const stuffed = matchKeywords(
      "plot median data outlier boxplot abnormal",
      ["plot", "median", "data", "outlier", "boxplot", "abnormal"]
    );
    expect(stuffed.score).toBeGreaterThan(0.8);
    const marks = marksFromFraction(hybridFraction(0.05, stuffed.score, weights), 5);
    expect(marks).toBeLessThan(3);
  });

  it("a better semantic answer never scores lower at equal keywords", () => {
    const low = marksFromFraction(hybridFraction(0.2, 0.5, weights), 5);
    const high = marksFromFraction(hybridFraction(0.8, 0.5, weights), 5);
    expect(high).toBeGreaterThan(low);
  });

  it("caps at max marks", () => {
    expect(marksFromFraction(hybridFraction(1, 1, weights), 5)).toBe(5);
  });
});

describe("keyword boundaries", () => {
  it("blank answer matches nothing", () => {
    const m = matchKeywords("   ", ["median", "plot"]);
    expect(m.found).toEqual([]);
    expect(m.score).toBe(0);
  });
});

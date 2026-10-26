import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { validateRubric } from "./loader";

describe("shipped rubrics", () => {
  const dir = path.join(process.cwd(), "rubrics");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

  it("has at least one rubric", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file} matches the rubric schema`, () => {
      const data = JSON.parse(readFileSync(path.join(dir, file), "utf-8"));
      const result = validateRubric(data);
      expect(result.errors).toEqual([]);
      expect(result.ok).toBe(true);
    });
  }
});

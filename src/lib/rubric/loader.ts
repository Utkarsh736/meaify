/* ============================================================
   Rubric loader — reads rubric JSON files from the project-root
   /rubrics folder (server-side only). Also validates structure.
   ------------------------------------------------------------
   Accepts BOTH snake_case (matches the original Colab notebook)
   and camelCase (matches TypeScript conventions) field names so
   rubric files are easy to write either way.
   ============================================================ */

import { promises as fs } from "fs";
import path from "path";
import type { Rubric, RubricValidation, RubricQuestion } from "@/types";

const RUBRICS_DIR = path.join(process.cwd(), "rubrics");

/** True rubric schema is the JSON file on disk; this metadata is the
 *  snapshot used for quick UI lists & DB. */
export interface RubricMeta {
  slug: string;
  title: string;
  description: string;
  questionCount: number;
  totalMarks: number;
}

/** Coerce a single question record (snake_case OR camelCase) → canonical shape. */
function coerceQuestion(q: Record<string, unknown>): {
  question: string;
  modelAnswer: string;
  keywords: string[];
  maxMarks: number;
} | null {
  const question = (q.question ?? q.questionText) as string | undefined;
  const modelAnswer = (q.model_answer ?? q.modelAnswer) as string | undefined;
  const keywords = (q.keywords ?? []) as unknown;
  const maxMarks = (q.max_marks ?? q.maxMarks) as number | undefined;

  if (!question || !modelAnswer || typeof maxMarks !== "number") {
    return null;
  }
  if (!Array.isArray(keywords)) {
    return null;
  }
  return {
    question,
    modelAnswer,
    keywords: keywords.filter((k): k is string => typeof k === "string"),
    maxMarks,
  };
}

/** List all rubric files (without loading question bodies). */
export async function listRubrics(): Promise<RubricMeta[]> {
  const files = await fs.readdir(RUBRICS_DIR).catch(() => [] as string[]);
  const metas: RubricMeta[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const r = await loadRubric(file.replace(/\.json$/, ""));
      metas.push({
        slug: r.slug,
        title: r.title,
        description: r.description,
        questionCount: Object.keys(r.questions).length,
        totalMarks: Object.values(r.questions).reduce(
          (s, q) => s + q.maxMarks,
          0
        ),
      });
    } catch (e) {
      console.warn(`[rubric] Skipping ${file}:`, (e as Error).message);
    }
  }
  return metas.sort((a, b) => a.title.localeCompare(b.title));
}

/** Load a single rubric by slug. */
export async function loadRubric(slug: string): Promise<Rubric> {
  const filePath = path.join(RUBRICS_DIR, `${slug}.json`);
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw) as Record<string, unknown>;
  const validation = validateRubric(data);
  if (!validation.ok) {
    throw new Error(`Invalid rubric ${slug}: ${validation.errors.join("; ")}`);
  }

  // Normalise questions to camelCase TS shape
  const rawQuestions = (data.questions ?? {}) as Record<string, Record<string, unknown>>;
  const questions: Rubric["questions"] = {};
  for (const [id, q] of Object.entries(rawQuestions)) {
    const coerced = coerceQuestion(q);
    if (coerced) questions[id] = coerced;
  }

  return {
    slug: (data.slug as string) ?? slug,
    title: (data.title as string) ?? slug,
    description: (data.description as string) ?? "",
    questions,
  };
}

/** Validate that a parsed object conforms to the Rubric schema (any case). */
export function validateRubric(data: Partial<Rubric> | Record<string, unknown>): RubricValidation {
  const errors: string[] = [];
  const d = data as Record<string, unknown>;
  if (!d.title) errors.push("missing `title`");
  if (!d.slug) errors.push("missing `slug`");
  if (!d.questions || typeof d.questions !== "object") {
    errors.push("missing `questions` object");
    return { ok: false, errors };
  }
  for (const [id, qRaw] of Object.entries(d.questions as Record<string, Record<string, unknown>>)) {
    const q = coerceQuestion(qRaw);
    if (!q) {
      errors.push(`Q${id}: needs question, model_answer/modelAnswer, max_marks/maxMarks (number), keywords (array)`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Save a rubric JSON file (used by the rubric editor). */
export async function saveRubric(slug: string, rubric: Rubric | Record<string, unknown>): Promise<void> {
  const validation = validateRubric(rubric as Record<string, unknown>);
  if (!validation.ok) {
    throw new Error(`Cannot save invalid rubric: ${validation.errors.join("; ")}`);
  }
  const filePath = path.join(RUBRICS_DIR, `${slug}.json`);
  await fs.writeFile(filePath, JSON.stringify(rubric, null, 2), "utf-8");
}

/** Return the path of the rubrics folder (for the README / UI). */
export function rubricsDir(): string {
  return RUBRICS_DIR;
}

/** Convenience: load + flatten to a RubricQuestion[] (used by the grading pipeline). */
export async function loadRubricQuestions(slug: string): Promise<RubricQuestion[]> {
  const rubric = await loadRubric(slug);
  return Object.entries(rubric.questions).map(
    ([id, q]) => ({ questionId: id, ...q })
  );
}

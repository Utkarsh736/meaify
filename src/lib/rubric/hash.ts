import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const RUBRICS_DIR = path.join(process.cwd(), "rubrics");

/** Fingerprint of the rubric file bytes. Historical scores stay reproducible. */
export async function rubricSha256(slug: string): Promise<string> {
  if (!/^[a-z0-9_-]+$/i.test(slug)) {
    throw new Error("invalid rubric slug");
  }
  const raw = await fs.readFile(path.join(RUBRICS_DIR, `${slug}.json`));
  return createHash("sha256").update(raw).digest("hex");
}

export async function allRubricHashes(): Promise<Record<string, string>> {
  const files = await fs.readdir(RUBRICS_DIR).catch(() => [] as string[]);
  const out: Record<string, string> = {};
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const slug = file.replace(/\.json$/, "");
    out[slug] = await rubricSha256(slug);
  }
  return out;
}

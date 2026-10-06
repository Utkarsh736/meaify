/* /api/rubric
 * GET  ?slug=<slug>     → returns the full rubric JSON
 * GET  (no slug)        → returns list of all rubric metas
 * POST { rubric: Rubric } → save (create or update) a rubric JSON file
 *
 * Files are stored on disk in /rubrics/<slug>.json so they are easy
 * to git-track, hand-edit, and version-control.
 */
import { NextResponse } from "next/server";
import { listRubrics, loadRubric, saveRubric } from "@/lib/rubric/loader";
import type { Rubric } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  try {
    if (slug) {
      const rubric = await loadRubric(slug);
      return NextResponse.json(rubric);
    }
    const metas = await listRubrics();
    return NextResponse.json({ rubrics: metas });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as { rubric?: Rubric };
  if (!body.rubric || !body.rubric.slug) {
    return NextResponse.json(
      { error: "rubric.slug is required" },
      { status: 400 }
    );
  }
  try {
    await saveRubric(body.rubric.slug, body.rubric);
    const reloaded = await loadRubric(body.rubric.slug);
    return NextResponse.json({ ok: true, rubric: reloaded });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

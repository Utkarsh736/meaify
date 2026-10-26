import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { resolveUploadPath } from "@/lib/uploads";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> }
) {
  const { name } = await ctx.params;
  const file = resolveUploadPath(name);
  if (!file) return NextResponse.json({ error: "bad name" }, { status: 400 });
  try {
    const buf = await fs.readFile(file);
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

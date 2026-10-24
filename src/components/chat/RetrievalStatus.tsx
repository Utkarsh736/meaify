"use client";

/* ============================================================
   RetrievalStatus — calm single-line status indicator.
   ------------------------------------------------------------
   No bouncy animations, no bouncing dots. Just a quiet line
   of text with a slow-pulsing dot that updates as the
   retrieval pipeline progresses.
   ============================================================ */

export type RetrievalStage = "idle" | "searching" | "found" | "generating";

const STAGES: Record<
  Exclude<RetrievalStage, "idle">,
  { label: string }
> = {
  searching: { label: "Searching knowledge base…" },
  found: { label: "Found relevant passages." },
  generating: { label: "Composing response…" },
};

export function RetrievalStatus({ stage }: { stage: RetrievalStage }) {
  if (stage === "idle") return null;
  const { label } = STAGES[stage];

  return (
    <article className="py-4">
      <div className="eyebrow text-[0.55rem] mb-2">Meaify</div>
      <div className="flex items-baseline gap-2 text-sm text-muted-foreground">
        <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
        <span className="italic">{label}</span>
      </div>
    </article>
  );
}

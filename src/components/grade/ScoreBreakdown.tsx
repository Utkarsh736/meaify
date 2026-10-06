"use client";

/* ============================================================
   ScoreBreakdown — shows the 0.6 × sem-sim + 0.4 × kw-match
   formula visually so students understand the score.
   ============================================================ */

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EvaluationResult } from "@/types";

export function ScoreBreakdown({ ev }: { ev: EvaluationResult }) {
  const pct = ev.maxMarks ? (ev.suggestedScore / ev.maxMarks) * 100 : 0;
  const semPct = Math.round(Math.max(0, ev.semanticSimilarity) * 100);
  const kwPct = Math.round(ev.keywordScore * 100);

  return (
    <Card className="card-soft p-5 animate-rise">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">
            Question {ev.questionId}
          </div>
          <h4 className="font-display text-base leading-tight pr-2">
            {ev.question}
          </h4>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-display brand-gradient-text">
            {ev.suggestedScore.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">
            / {ev.maxMarks} marks
          </div>
        </div>
      </div>

      <Progress
        value={pct}
        className="h-2 bg-muted mb-4"
        // soft sky tint
      />

      <div className="grid grid-cols-2 gap-3">
        <ScoreSub
          label="Semantic similarity"
          value={semPct}
          hint="0.6 × weight"
          color="var(--brand)"
        />
        <ScoreSub
          label="Keyword match"
          value={kwPct}
          hint="0.4 × weight"
          color="var(--brand-accent)"
        />
      </div>

      <div className="mt-4 grid gap-2">
        <div className="text-xs text-muted-foreground">
          Keywords found ({ev.foundKeywords.length}/{ev.keywords.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ev.keywords.map((kw) => {
            const found = ev.foundKeywords.includes(kw);
            return (
              <span
                key={kw}
                className={
                  "pill " +
                  (found
                    ? "bg-brand/10 text-brand"
                    : "bg-destructive/10 text-destructive line-through")
                }
              >
                {kw}
              </span>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function ScoreSub({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: number;
  hint: string;
  color: string;
}) {
  return (
    <div className="rounded-md bg-muted/40 p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-display" style={{ color }}>
          {value}%
        </span>
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      </div>
      <Progress
        value={value}
        className="h-1.5 bg-background/60 mt-1"
      />
    </div>
  );
}

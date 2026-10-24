"use client";

/* ============================================================
   GradingReport — top-level summary + per-question score cards.
   ============================================================ */

import { Card } from "@/components/ui/card";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { FeedbackCard } from "./FeedbackCard";
import { OcrOutput } from "./OcrOutput";
import { Award, TrendingUp, Target } from "lucide-react";
import type { GradingReport as GradingReportT } from "@/types";

export function GradingReport({ report }: { report: GradingReportT }) {
  const pct = report.totalMax ? (report.totalScore / report.totalMax) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary hero card */}
      <Card className="card-soft p-6 relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient-bg-soft opacity-50 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="brand-gradient-bg w-14 h-14 rounded-2xl flex items-center justify-center shadow-soft-md">
              <Award className="text-white" size={26} />
            </span>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">
                Final score
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl brand-gradient-text">
                  {report.totalScore.toFixed(1)}
                </span>
                <span className="text-xl text-muted-foreground">
                  / {report.totalMax}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
            <Stat
              icon={TrendingUp}
              label="Average"
              value={`${pct.toFixed(1)}%`}
            />
            <Stat
              icon={Target}
              label="Questions"
              value={`${report.evaluations.length}`}
            />
            <Stat
              icon={Award}
              label="Provider"
              value={report.ocr.provider.toUpperCase()}
            />
          </div>
        </div>
      </Card>

      {/* Raw OCR + Segmented */}
      <OcrOutput report={report} />

      {/* Per-question cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {report.evaluations.map((ev) => (
          <div key={ev.questionId}>
            <ScoreBreakdown ev={ev} />
            <FeedbackCard ev={ev} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Award;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-card/80 backdrop-blur p-3 border border-border/60">
      <Icon size={14} className="text-brand mb-1.5" />
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-lg text-foreground">{value}</div>
    </div>
  );
}

"use client";

/* ============================================================
   AiGradingView — right pane of the grading workspace.
   ------------------------------------------------------------
   Structured, collapsible sections — but presented as quiet
   editorial blocks separated by thin horizontal rules, NOT
   accordion chrome. Three sections per question:
     1. Score (large mono number, semantic color)
     2. Breakdown (sem sim + kw match + missing keywords)
     3. Feedback (italic serif quote, regeneratable)
   ============================================================ */

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EvaluationResult } from "@/types";

export function AiGradingView({
  evaluations,
  totalScore,
  totalMax,
  activeKeyword,
  onKeywordClick,
  onFeedbackUpdated,
}: {
  evaluations: EvaluationResult[];
  totalScore: number;
  totalMax: number;
  activeKeyword: string | null;
  onKeywordClick: (kw: string | null) => void;
  onFeedbackUpdated?: (qId: string, newFeedback: string) => void;
}) {
  if (!evaluations.length) {
    return (
      <div className="empty-state-editorial h-full justify-center">
        <p className="font-display text-2xl text-foreground leading-snug">
          <span className="italic-display text-muted-foreground">
            AI grading.
          </span>
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Score breakdown, missing keywords, and AI feedback will appear
          here in structured sections once grading completes.
        </p>
      </div>
    );
  }

  const pct = totalMax ? (totalScore / totalMax) * 100 : 0;
  const totalClass =
    pct >= 80 ? "text-excellent" : pct >= 50 ? "text-warning" : "text-needs-work";

  return (
    <div className="space-y-8">
      {/* Top summary — single large number */}
      <header className="space-y-2">
        <div className="eyebrow text-[0.55rem]">Overall score</div>
        <div className="flex items-baseline gap-3">
          <span className={cn("font-mono text-5xl tabular leading-none", totalClass)}>
            {totalScore.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground tabular">
            / {totalMax} · {pct.toFixed(0)}%
          </span>
        </div>
      </header>

      <hr className="editorial-rule" />

      {/* Per-question sections */}
      <div className="space-y-8">
        {evaluations.map((ev) => {
          const qPct = ev.maxMarks ? (ev.suggestedScore / ev.maxMarks) * 100 : 0;
          const qClass =
            qPct >= 80
              ? "text-excellent"
              : qPct >= 50
              ? "text-warning"
              : "text-needs-work";
          return (
            <section key={ev.questionId} className="space-y-4">
              {/* Header */}
              <header className="flex items-baseline justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="eyebrow text-[0.55rem] mb-1">
                    Question {ev.questionId}
                  </div>
                  <p className="text-sm text-foreground truncate">
                    {ev.question}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn("font-mono text-xl tabular", qClass)}>
                    {ev.suggestedScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular">
                    /{ev.maxMarks}
                  </span>
                </div>
              </header>

              {/* Breakdown */}
              <div className="space-y-3 pl-3 border-l border-border">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <Metric
                    label="Semantic sim"
                    value={`${Math.round(Math.max(0, ev.semanticSimilarity) * 100)}%`}
                  />
                  <Metric
                    label="Keyword match"
                    value={`${Math.round(ev.keywordScore * 100)}%`}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="eyebrow text-[0.55rem]">
                    Keywords · {ev.foundKeywords.length}/{ev.keywords.length}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ev.keywords.map((kw) => {
                      const found = ev.foundKeywords.includes(kw);
                      const isActive = activeKeyword === kw;
                      return (
                        <button
                          key={kw}
                          onClick={() => onKeywordClick(isActive ? null : kw)}
                          className={cn(
                            "inline-flex items-baseline px-2 py-0.5 text-xs border transition-colors rounded-sm",
                            isActive
                              ? "bg-amber-100 border-amber-400 text-amber-900"
                              : found
                              ? "border-excellent/30 text-excellent hover:bg-excellent/5"
                              : "border-needs-work/30 text-needs-work hover:bg-needs-work/5 line-through"
                          )}
                          title={
                            found
                              ? "Found — click to highlight in student answer"
                              : "Missing — click to highlight in student answer"
                          }
                        >
                          {kw}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <Feedback
                ev={ev}
                onFeedbackUpdated={(newFb) =>
                  onFeedbackUpdated?.(ev.questionId, newFb)
                }
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular text-foreground">{value}</span>
    </div>
  );
}

function Feedback({
  ev,
  onFeedbackUpdated,
}: {
  ev: EvaluationResult;
  onFeedbackUpdated: (newFeedback: string) => void;
}) {
  const [feedback, setFeedback] = useState(ev.feedback);
  const [regenerating, setRegenerating] = useState(false);

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: ev.question,
          studentAnswer: ev.studentAnswer,
          score: ev.suggestedScore,
          maxMarks: ev.maxMarks,
          missingKeywords: ev.missingKeywords,
        }),
      });
      const data = await res.json();
      if (data.feedback) {
        setFeedback(data.feedback);
        onFeedbackUpdated(data.feedback);
        toast.success("Feedback regenerated");
      } else {
        toast.error(data.error ?? "Failed to regenerate");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-[0.55rem]">AI feedback</span>
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground hover:text-foreground transition-colors"
        >
          {regenerating ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <RefreshCw size={10} />
          )}
          Regenerate
        </button>
      </div>
      <p className="font-display text-base italic text-foreground/85 leading-relaxed border-l border-primary/30 pl-3">
        {feedback}
      </p>
    </div>
  );
}

// Quiet loading skeleton for the whole right pane
export function GradingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-2 w-16 bg-muted pulse-slow" />
        <Skeleton className="h-12 w-32 bg-muted pulse-slow" />
      </div>
      <hr className="editorial-rule" />
      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-3 w-32 bg-muted pulse-slow" />
            <Skeleton className="h-4 w-20 bg-muted pulse-slow ml-auto" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-3 w-full bg-muted pulse-slow" />
              <Skeleton className="h-3 w-full bg-muted pulse-slow" />
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-12 bg-muted pulse-slow rounded-sm" />
              ))}
            </div>
            <Skeleton className="h-16 w-full bg-muted pulse-slow" />
          </div>
        ))}
      </div>
    </div>
  );
}

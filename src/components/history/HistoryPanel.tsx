"use client";

/* ============================================================
   HistoryPanel — clean list of past submissions.
   Editorial calm — vertical list with thin rules, no table chrome.
   ============================================================ */

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { AppView } from "@/components/layout/AppShell";

interface SubmissionRow {
  id: string;
  slug: string;
  fileName: string;
  rubricId: string;
  totalScore: number;
  totalMax: number;
  ocrProvider: string;
  ocrLatency: number;
  createdAt: string;
}

interface SubmissionDetail extends SubmissionRow {
  ocrText: string;
  evaluations: Array<{
    questionId: string;
    question: string;
    studentAnswer: string;
    modelAnswer: string;
    keywords: string[];
    maxMarks: number;
    suggestedScore: number;
    semanticSimilarity: number;
    missingKeywords: string[];
    feedback: string;
  }>;
}

export function HistoryPanel({
  onViewChange,
}: {
  onViewChange?: (v: AppView) => void;
}) {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.submissions) setRows(data.submissions);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function openDetail(id: string) {
    setLoadingDetail(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/history?id=${id}`);
      const data = await res.json();
      if (data.submission) setDetail(data.submission);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <header className="space-y-2">
        <div className="eyebrow text-[0.55rem]">Workspace · 05</div>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="space-y-1.5">
            <h1 className="font-display text-3xl md:text-4xl text-foreground">
              History
            </h1>
            <p className="text-xs text-muted-foreground">
              Every submission persists to a local SQLite database via
              Prisma. Click any row for the full grading report.
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      <hr className="editorial-rule" />

      {/* List */}
      <div className="max-w-3xl">
        {loading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="py-4 flex items-baseline justify-between gap-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-32 bg-muted pulse-slow" />
                  <Skeleton className="h-2 w-20 bg-muted pulse-slow" />
                </div>
                <Skeleton className="h-4 w-12 bg-muted pulse-slow" />
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <div className="empty-state-editorial">
            <p className="font-display text-2xl text-foreground leading-snug">
              <span className="italic-display text-muted-foreground">
                No submissions yet.
              </span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Grade an answer sheet on the Grade tab to see it appear here
              automatically, persisted to local SQLite.
            </p>
            {onViewChange && (
              <button
                onClick={() => onViewChange("grade")}
                className="text-sm text-primary hover:underline mt-1"
              >
                Begin a new grading session →
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => {
              const pct = r.totalMax ? (r.totalScore / r.totalMax) * 100 : 0;
              const scoreClass =
                pct >= 80
                  ? "text-excellent"
                  : pct >= 50
                  ? "text-warning"
                  : "text-needs-work";
              return (
                <li
                  key={r.id}
                  onClick={() => openDetail(r.id)}
                  className="py-4 flex items-baseline justify-between gap-4 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {r.slug}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-baseline gap-2 font-mono tabular">
                      <span>{r.rubricId}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{r.ocrProvider?.toUpperCase()}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-mono text-base tabular ${scoreClass}`}>
                      {r.totalScore.toFixed(1)}
                      <span className="text-xs text-muted-foreground">
                        /{r.totalMax}
                      </span>
                    </div>
                    <div className="text-[0.65rem] text-muted-foreground tabular mt-0.5">
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={!!detail || loadingDetail}
        onOpenChange={(o) => !o && setDetail(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {loadingDetail ? (
            <div className="py-12 space-y-3">
              <Skeleton className="h-5 w-1/3 bg-muted pulse-slow" />
              <Skeleton className="h-32 w-full bg-muted pulse-slow" />
              <Skeleton className="h-16 w-full bg-muted pulse-slow" />
            </div>
          ) : detail ? (
            <div className="space-y-6">
              <DialogHeader className="space-y-2">
                <DialogTitle className="font-display text-2xl">
                  {detail.slug}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {detail.rubricId} ·{" "}
                  <span className="font-mono tabular text-foreground">
                    {detail.totalScore.toFixed(1)} / {detail.totalMax}
                  </span>{" "}
                  · {detail.ocrProvider?.toUpperCase()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <div className="eyebrow text-[0.55rem]">Raw OCR</div>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/30 p-3 max-h-40 overflow-y-auto border border-border rounded-sm text-muted-foreground">
                  {detail.ocrText}
                </pre>
              </div>

              <div className="divide-y divide-border">
                {detail.evaluations.map((e) => {
                  const qPct = e.maxMarks
                    ? (e.suggestedScore / e.maxMarks) * 100
                    : 0;
                  const qClass =
                    qPct >= 80
                      ? "text-excellent"
                      : qPct >= 50
                      ? "text-warning"
                      : "text-needs-work";
                  return (
                    <article key={e.questionId} className="py-5 space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="eyebrow text-[0.55rem]">
                          Question {e.questionId}
                        </div>
                        <span className={`font-mono text-base tabular ${qClass}`}>
                          {e.suggestedScore.toFixed(1)}/{e.maxMarks}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{e.question}</p>
                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                        {e.feedback}
                      </p>
                      {e.missingKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[0.6rem] text-muted-foreground/60 uppercase tracking-widest">
                            Missing
                          </span>
                          {e.missingKeywords.map((k) => (
                            <span
                              key={k}
                              className="inline-flex items-baseline px-2 py-0.5 text-xs border border-needs-work/30 text-needs-work line-through rounded-sm"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

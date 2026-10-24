"use client";

/* ============================================================
   RecentTasks — clean vertical list, no table chrome.
   ------------------------------------------------------------
   Each row: submission name (left), score (right), thin rule
   between. Skeletons use slow pulse (no shimmer).
   Empty state is typographic — no icon-in-box.
   ============================================================ */

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import type { AppView } from "@/components/layout/AppShell";

interface SubmissionRow {
  id: string;
  slug: string;
  rubricId: string;
  totalScore: number;
  totalMax: number;
  ocrProvider: string;
  createdAt: string;
}

export function RecentTasks({
  onViewChange,
  limit = 5,
}: {
  onViewChange: (v: AppView) => void;
  limit?: number;
}) {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/history")
      .then((r) => r.json())
      .then((data: { submissions?: SubmissionRow[] }) => {
        if (mounted && data.submissions) setRows(data.submissions.slice(0, limit));
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [limit]);

  if (loading) {
    return (
      <ul className="divide-y divide-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="py-3.5 flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-32 bg-muted pulse-slow" />
              <Skeleton className="h-2 w-20 bg-muted pulse-slow" />
            </div>
            <Skeleton className="h-4 w-12 bg-muted pulse-slow" />
          </li>
        ))}
      </ul>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="empty-state-editorial">
        <p className="font-display text-2xl text-foreground leading-snug">
          <span className="italic-display text-muted-foreground">
            No papers graded yet.
          </span>
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Upload a handwritten answer sheet to run the AI-assisted grading
          pipeline. The first submission will appear here automatically.
        </p>
        <button
          onClick={() => onViewChange("grade")}
          className="text-sm text-primary hover:underline mt-1"
        >
          Begin a new grading session →
        </button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => {
        const pct = r.totalMax ? (r.totalScore / r.totalMax) * 100 : 0;
        const scoreClass =
          pct >= 80 ? "text-excellent" : pct >= 50 ? "text-warning" : "text-needs-work";
        return (
          <li
            key={r.id}
            onClick={() => onViewChange("history")}
            className="py-3.5 flex items-baseline justify-between gap-4 cursor-pointer group"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {r.slug}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span className="font-mono tabular">{r.rubricId}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono tabular">{r.ocrProvider}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="tabular">{timeAgo(r.createdAt)}</span>
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
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Re-export FileText as a no-op (kept for backward imports).
export { FileText as _FileText };

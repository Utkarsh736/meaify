"use client";

/* ============================================================
   StatsAside — inline minimal stats column.
   ------------------------------------------------------------
   No card chrome, no chunky badges. Three quiet rows:
     Papers graded · Average score · Last rubric
   Each row: label (small caps eyebrow) | value (mono, large)
   ============================================================ */

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppView } from "@/components/layout/AppShell";

interface SubmissionRow {
  id: string;
  totalScore: number;
  totalMax: number;
  rubricId: string;
  createdAt: string;
}

export function StatsAside({
  onViewChange,
}: {
  onViewChange: (v: AppView) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SubmissionRow[]>([]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/history")
      .then((r) => r.json())
      .then((data: { submissions?: SubmissionRow[] }) => {
        if (mounted && data.submissions) setRows(data.submissions);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const avgPct = rows.length
    ? rows.reduce((s, r) => s + (r.totalScore / (r.totalMax || 1)) * 100, 0) /
      rows.length
    : 0;
  const activeRubric = rows[0]?.rubricId ?? "—";
  const avgClass =
    avgPct >= 80 ? "text-excellent" : avgPct >= 50 ? "text-warning" : "text-needs-work";

  return (
    <div className="space-y-5">
      <Stat
        label="Papers graded"
        value={loading ? null : rows.length.toString()}
        loading={loading}
      />
      <Stat
        label="Average score"
        value={loading ? null : `${avgPct.toFixed(1)}%`}
        loading={loading}
        valueClass={avgClass}
      />
      <Stat
        label="Last rubric"
        value={loading ? null : activeRubric}
        loading={loading}
        mono={false}
      />
      <button
        onClick={() => onViewChange("history")}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
      >
        See full history →
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  loading,
  valueClass = "text-foreground",
  mono = true,
}: {
  label: string;
  value: string | null;
  loading: boolean;
  valueClass?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="eyebrow text-[0.55rem]">{label}</span>
      {loading ? (
        <Skeleton className="h-5 w-12 bg-muted pulse-slow" />
      ) : (
        <span
          className={`text-lg ${valueClass} ${mono ? "font-mono tabular" : "font-display"}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

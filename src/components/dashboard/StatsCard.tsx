"use client";

/* ============================================================
   StatsCard — square card with key metrics.
   ------------------------------------------------------------
   Stats: Papers graded · Average score · Active rubric
   Shows shimmer-skeleton when data is loading.
   ============================================================ */

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, FileText, TrendingUp, ArrowUpRight } from "lucide-react";
import type { AppView } from "@/components/layout/AppShell";

interface SubmissionRow {
  id: string;
  totalScore: number;
  totalMax: number;
  rubricId: string;
  createdAt: string;
}

export function StatsCard({
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

  return (
    <button
      onClick={() => onViewChange("history")}
      className="w-full h-full text-left p-6 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          At a glance
        </span>
        <ArrowUpRight size={14} className="text-muted-foreground" />
      </div>

    <div className="space-y-4 flex-1">
      <Stat
        icon={<FileText size={14} className="text-primary" />}
        label="Papers graded"
        loading={loading}
        value={loading ? null : rows.length.toString()}
      />
      <Stat
        icon={<TrendingUp size={14} className="text-emerald-500" />}
        label="Average score"
        loading={loading}
        value={loading ? null : `${avgPct.toFixed(1)}%`}
      />
      <Stat
        icon={<Award size={14} className="text-amber-500" />}
        label="Last rubric"
        loading={loading}
        value={loading ? null : activeRubric}
      />
    </div>
    </button>
  );
}

function Stat({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-5 w-12 bg-muted" />
      ) : (
        <span className="font-display text-lg text-foreground tabular-nums">
          {value}
        </span>
      )}
    </div>
  );
}

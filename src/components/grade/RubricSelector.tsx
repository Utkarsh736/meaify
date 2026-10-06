"use client";

/* ============================================================
   RubricSelector — dropdown to pick a rubric JSON file from
   the /rubrics folder. Calls /api/rubric (no slug) for the
   list, then loads full rubric on selection.
   ============================================================ */

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, ChevronDown } from "lucide-react";

export interface RubricMeta {
  slug: string;
  title: string;
  description: string;
  questionCount: number;
  totalMarks: number;
}

export function RubricSelector({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (slug: string) => void;
  className?: string;
}) {
  const [metas, setMetas] = useState<RubricMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/rubric")
      .then((r) => r.json())
      .then((data: { rubrics?: RubricMeta[] }) => {
        if (mounted && data.rubrics) {
          setMetas(data.rubrics);
          // Auto-select first rubric if none chosen yet
          if (!value && data.rubrics[0]) onChange(data.rubrics[0].slug);
        }
      })
      .catch((e) => console.error("[RubricSelector]", e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [onChange, value]);

  const selected = metas.find((m) => m.slug === value);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <FileText size={15} />
        <span>Active rubric</span>
      </div>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading || metas.length === 0}
      >
        <SelectTrigger className="h-11 bg-card shadow-soft-sm border-border/60">
          <SelectValue placeholder={loading ? "Loading rubrics…" : "Pick a rubric"}>
            {selected ? (
              <span className="flex items-center gap-2">
                <span className="font-medium text-foreground">{selected.title}</span>
                <span className="pill bg-muted text-muted-foreground">
                  {selected.questionCount}Q · {selected.totalMarks} marks
                </span>
              </span>
            ) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {metas.map((m) => (
            <SelectItem key={m.slug} value={m.slug}>
              <div className="flex flex-col py-0.5">
                <span className="font-medium">{m.title}</span>
                <span className="text-xs text-muted-foreground">
                  {m.questionCount} questions · {m.totalMarks} marks total
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected?.description && (
        <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
          <ChevronDown size={12} className="mt-0.5 shrink-0 opacity-50" />
          {selected.description}
        </p>
      )}
    </div>
  );
}

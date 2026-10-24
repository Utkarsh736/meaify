"use client";

/* ============================================================
   RubricSelector — minimal dropdown, editorial calm.
   ============================================================ */

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <div className="eyebrow text-[0.55rem] mb-1.5">Active rubric</div>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading || metas.length === 0}
      >
        <SelectTrigger className="bg-transparent border-border h-9 hover:border-foreground/20 text-sm">
          <SelectValue
            placeholder={loading ? "Loading…" : "Pick a rubric"}
          >
            {selected ? (
              <span className="flex items-baseline gap-2">
                <span className="text-foreground">{selected.title}</span>
                <span className="font-mono text-[0.65rem] text-muted-foreground tabular">
                  {selected.questionCount}Q · {selected.totalMarks}
                </span>
              </span>
            ) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {metas.map((m) => (
            <SelectItem key={m.slug} value={m.slug}>
              <div className="flex flex-col py-0.5">
                <span>{m.title}</span>
                <span className="text-xs text-muted-foreground font-mono tabular">
                  {m.questionCount} questions · {m.totalMarks} marks
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

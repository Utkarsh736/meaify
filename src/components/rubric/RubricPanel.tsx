"use client";

/* ============================================================
   RubricPanel — browse / preview / edit rubric JSON files.
   Editorial calm: thin rules, no card chrome, generous space.
   ============================================================ */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save,
  RefreshCw,
  Pencil,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { RubricSelector } from "@/components/grade/RubricSelector";
import type { Rubric, RubricValidation } from "@/types";

export function RubricPanel() {
  const [slug, setSlug] = useState("");
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [valid, setValid] = useState<RubricValidation | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setEditing(false);
    fetch(`/api/rubric?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: Rubric) => {
        setRubric(data);
        setRaw(JSON.stringify(data, null, 2));
      })
      .catch((e) => toast.error("Failed to load rubric: " + e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  function validateRaw() {
    try {
      const parsed = JSON.parse(raw) as Rubric;
      const errors: string[] = [];
      if (!parsed.title) errors.push("missing `title`");
      if (!parsed.slug) errors.push("missing `slug`");
      if (!parsed.questions || typeof parsed.questions !== "object") {
        errors.push("missing `questions` object");
      }
      setValid({ ok: errors.length === 0, errors });
      return { parsed, ok: errors.length === 0 };
    } catch (e) {
      setValid({ ok: false, errors: [(e as Error).message] });
      return { parsed: null, ok: false };
    }
  }

  async function save() {
    const { parsed, ok } = validateRaw();
    if (!parsed || !ok) {
      toast.error("Cannot save invalid JSON");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubric: parsed }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Rubric saved");
        setEditing(false);
        if (data.rubric) {
          setRubric(data.rubric);
          setRaw(JSON.stringify(data.rubric, null, 2));
        }
      } else {
        toast.error(data.error ?? "Save failed");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 fade-in">
      <header className="space-y-2">
        <div className="eyebrow text-[0.55rem]">Workspace · 04</div>
        <h1 className="font-display text-3xl md:text-4xl text-foreground">
          Rubrics
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
          Rubrics live as JSON files in{" "}
          <code className="font-mono text-xs">/rubrics/*.json</code> —
          git-trackable, hand-editable. Switch between them, or edit
          inline. The loader accepts both snake_case and camelCase field
          names.
        </p>
      </header>

      <hr className="editorial-rule" />

      <div className="max-w-xs">
        <RubricSelector value={slug} onChange={setSlug} />
      </div>

      {loading && (
        <div className="space-y-3 max-w-2xl">
          <Skeleton className="h-5 w-1/3 bg-muted pulse-slow" />
          <Skeleton className="h-32 w-full bg-muted pulse-slow" />
        </div>
      )}

      {!loading && rubric && (
        <div className="max-w-3xl space-y-6">
          <header className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl text-foreground">
                {rubric.title}
              </h2>
              <div className="flex items-center gap-2">
                <span className="eyebrow text-[0.55rem] font-mono">
                  {rubric.slug}
                </span>
                {editing ? (
                  <>
                    <button
                      onClick={() => {
                        setRaw(JSON.stringify(rubric, null, 2));
                        setEditing(false);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={save}
                      disabled={saving}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {saving ? (
                        <RefreshCw size={11} className="animate-spin" />
                      ) : (
                        <Save size={11} />
                      )}
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil size={11} />
                    Edit
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic">
              {rubric.description}
            </p>
          </header>

          {editing ? (
            <div className="space-y-3">
              <Textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                onBlur={validateRaw}
                className="font-mono text-xs min-h-[400px] resize-y bg-muted/30 border-border"
                spellCheck={false}
              />
              {valid && (
                <div
                  className={
                    "flex items-center gap-2 text-xs px-3 py-2 border rounded-sm " +
                    (valid.ok
                      ? "border-excellent/30 text-excellent bg-excellent/5"
                      : "border-needs-work/30 text-needs-work bg-needs-work/5")
                  }
                >
                  {valid.ok ? <Check size={12} /> : <AlertCircle size={12} />}
                  {valid.ok ? "JSON is valid" : `Errors: ${valid.errors.join("; ")}`}
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {Object.entries(rubric.questions).map(([qid, q]) => (
                <article key={qid} className="py-5 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="eyebrow text-[0.55rem]">Question {qid}</div>
                    <span className="font-mono text-xs text-muted-foreground tabular">
                      {q.maxMarks} marks
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{q.question}</p>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    {q.modelAnswer}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {q.keywords.map((k) => (
                      <span
                        key={k}
                        className="inline-flex items-baseline px-2 py-0.5 text-xs border border-border text-muted-foreground rounded-sm"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

/* ============================================================
   RubricPanel — browse / preview / edit rubric JSON files.
   ------------------------------------------------------------
   Loads the rubric list from /api/rubric, previews the selected
   rubric, and (optionally) lets you edit JSON inline + save.
   ============================================================ */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Save, RefreshCw, Pencil, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { RubricSelector, type RubricMeta } from "@/components/grade/RubricSelector";
import type { Rubric, RubricValidation } from "@/types";

export function RubricPanel() {
  const [slug, setSlug] = useState("");
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [valid, setValid] = useState<RubricValidation | null>(null);

  // Load rubric whenever slug changes
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
      // basic shape check
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
    <div className="space-y-6">
      <Card className="card-soft p-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 brand-gradient-bg-soft rounded-full opacity-50 blur-2xl" />
        <div className="relative space-y-2">
          <div className="pill bg-brand-accent/30 text-amber-800 w-fit">
            <FileText size={11} /> Rubric files live in /rubrics/*.json
          </div>
          <h2 className="font-display text-2xl">Manage rubrics</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Rubrics are plain JSON files in the project-root{" "}
            <code className="text-foreground bg-muted px-1 py-0.5 rounded text-xs">
              /rubrics/
            </code>{" "}
            folder, so they are easy to git-track and hand-edit. Switch between
            rubrics with the dropdown below, or edit one inline and save.
          </p>
        </div>
      </Card>

      <RubricSelector value={slug} onChange={setSlug} />

      {loading && (
        <Card className="card-soft p-6">
          <Skeleton className="h-6 w-1/3 mb-3" />
          <Skeleton className="h-32 w-full" />
        </Card>
      )}

      {!loading && rubric && (
        <Card className="card-soft p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between bg-gradient-to-r from-brand/5 to-brand-accent/10">
            <div>
              <h3 className="font-display text-lg">{rubric.title}</h3>
              <p className="text-xs text-muted-foreground">{rubric.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{rubric.slug}</Badge>
              {editing ? (
                <>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setRaw(JSON.stringify(rubric, null, 2));
                    setEditing(false);
                  }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={save} disabled={saving}>
                    {saving ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Pencil size={13} /> Edit
                </Button>
              )}
            </div>
          </div>

          {editing ? (
            <div className="p-4 space-y-3">
              <Textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                onBlur={validateRaw}
                className="font-mono text-xs min-h-[400px] resize-y scroll-soft"
                spellCheck={false}
              />
              {valid && (
                <div
                  className={
                    "flex items-center gap-2 text-xs " +
                    (valid.ok
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-destructive bg-destructive/5")
                  }
                >
                  {valid.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                  {valid.ok ? "JSON is valid" : `Errors: ${valid.errors.join("; ")}`}
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {Object.entries(rubric.questions).map(([qid, q]) => (
                <div
                  key={qid}
                  className="rounded-lg border border-border/60 p-4 bg-card/50"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="pill bg-brand/10 text-brand mb-1.5 inline-flex">
                        Question {qid}
                      </span>
                      <p className="font-medium text-sm">{q.question}</p>
                    </div>
                    <Badge variant="outline">{q.max_marks ?? q.maxMarks ?? 0} marks</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    <span className="text-foreground/80 font-medium">Model:</span>{" "}
                    {q.model_answer ?? q.modelAnswer}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(q.keywords ?? []).map((k) => (
                      <span key={k} className="pill bg-brand-accent/30 text-amber-800">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

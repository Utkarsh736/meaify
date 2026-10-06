"use client";

/* ============================================================
   GradingTab — the main "Grade" tab.
   ------------------------------------------------------------
   Flow:
     1. Pick a rubric
     2. Upload answer-sheet image
     3. Click "Grade" — POST /api/grade
     4. Show OCR / scores / feedback
   ============================================================ */

import { useCallback, useState } from "react";
import { RubricSelector } from "./RubricSelector";
import { UploadCard } from "./UploadCard";
import { GradingReport } from "./GradingReport";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { GradingReport as GradingReportT } from "@/types";

interface ImageData {
  base64: string;
  mimeType: string;
  fileName: string;
}

export function GradingTab() {
  const [rubricSlug, setRubricSlug] = useState("");
  const [image, setImage] = useState<ImageData | null>(null);
  const [report, setReport] = useState<GradingReportT | null>(null);
  const [grading, setGrading] = useState(false);

  const onImageReady = useCallback((data: ImageData) => {
    setImage(data);
    setReport(null);
  }, []);

  async function grade() {
    if (!image || !rubricSlug) {
      toast.error("Please pick a rubric and upload an image first.");
      return;
    }
    setGrading(true);
    setReport(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: image.base64,
          mimeType: image.mimeType,
          rubricSlug,
          fileName: image.fileName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Grading failed");
        return;
      }
      setReport(data as GradingReportT);
      toast.success(
        `Graded ${data.evaluations.length} answers · ${(data.totalScore / data.totalMax * 100).toFixed(1)}%`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGrading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero / intro */}
      <Card className="card-soft p-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 brand-gradient-bg-soft rounded-full opacity-60 blur-2xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="space-y-1.5">
            <div className="pill bg-brand/10 text-brand w-fit">
              <Sparkles size={11} /> Vision OCR + Rubric grading
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
              Grade handwritten answers with{" "}
              <span className="brand-gradient-text">AI-assisted</span> scoring
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
              Upload an answer sheet, run Groq (or Gemini as failsafe) OCR, then
              score every answer against the rubric with semantic similarity +
              keyword matching. Each question gets AI feedback you can
              regenerate with one click.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              Groq · Gemini · HF inference
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6 items-start">
        {/* Left: upload + rubric */}
        <div className="space-y-4">
          <RubricSelector value={rubricSlug} onChange={setRubricSlug} />
          <div className="relative">
            <UploadCard onImageReady={onImageReady} isProcessing={grading} />
          </div>
          <Button
            onClick={grade}
            disabled={!image || !rubricSlug || grading}
            className="brand-gradient-bg h-12 w-full text-white font-medium shadow-soft-sm hover:shadow-soft-md transition-shadow disabled:opacity-50"
            size="lg"
          >
            <Wand2 size={18} />
            {grading ? "Grading…" : "Grade answer sheet"}
            {!grading && <ArrowRight size={16} className="ml-1" />}
          </Button>
          {grading && (
            <p className="text-xs text-muted-foreground text-center">
              OCR + embeddings + per-question feedback — this takes 5–15&nbsp;s.
            </p>
          )}
        </div>

        {/* Right: report */}
        <div className="min-h-[400px]">
          {report ? (
            <GradingReport report={report} />
          ) : (
            <Card className="card-soft p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="brand-gradient-bg w-16 h-16 rounded-2xl flex items-center justify-center shadow-soft-md mb-4 opacity-70">
                <Sparkles className="text-white" size={28} />
              </div>
              <h3 className="font-display text-xl mb-1.5">Your report will appear here</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Pick a rubric and upload a handwritten answer sheet to see the
                AI-assisted grading breakdown.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

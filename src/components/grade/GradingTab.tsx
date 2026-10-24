"use client";

/* ============================================================
   GradingTab — master-detail split view (editorial calm).
   ------------------------------------------------------------
   Left: Student text (typeset). Right: AI grading & feedback
   (structured sections separated by rules).

   Three states:
     1. No image — quiet upload prompt on left, empty state right
     2. Grading — slow-pulse skeletons on both sides
     3. Report — StudentView (left) + AiGradingView (right)

   The split collapses to a single column on narrow viewports.
   ============================================================ */

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RubricSelector } from "./RubricSelector";
import { StudentView } from "./StudentView";
import { AiGradingView, GradingSkeleton } from "./AiGradingView";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GradingReport as GradingReportT } from "@/types";

interface ImageData {
  base64: string;
  mimeType: string;
  fileName: string;
  preview: string;
}

export function GradingTab() {
  const [rubricSlug, setRubricSlug] = useState("");
  const [image, setImage] = useState<ImageData | null>(null);
  const [report, setReport] = useState<GradingReportT | null>(null);
  const [grading, setGrading] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const onImageReady = useCallback(
    (data: { base64: string; mimeType: string; fileName: string }) => {
      const preview = `data:${data.mimeType};base64,${data.base64}`;
      setImage({ ...data, preview });
      setReport(null);
    },
    []
  );

  async function grade() {
    if (!image || !rubricSlug) {
      toast.error("Pick a rubric and upload an image first.");
      return;
    }
    setGrading(true);
    setReport(null);
    setActiveKeyword(null);
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
        `Graded ${data.evaluations.length} answers · ${(
          (data.totalScore / data.totalMax) * 100
        ).toFixed(1)}%`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGrading(false);
    }
  }

  function handleKeywordClick(kw: string | null) {
    setActiveKeyword(kw);
    if (kw && report) {
      const q = report.evaluations.find(
        (e) => e.keywords.includes(kw) || e.missingKeywords.includes(kw)
      );
      setActiveQuestionId(q?.questionId ?? null);
    } else {
      setActiveQuestionId(null);
    }
  }

  function handleFeedbackUpdate(qId: string, newFeedback: string) {
    if (!report) return;
    setReport({
      ...report,
      evaluations: report.evaluations.map((e) =>
        e.questionId === qId ? { ...e, feedback: newFeedback } : e
      ),
    });
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Editorial header */}
      <header className="space-y-3">
        <div className="eyebrow text-[0.55rem]">Workspace · 02</div>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="space-y-1.5">
            <h1 className="font-display text-3xl md:text-4xl text-foreground">
              Grade an answer sheet
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Upload a handwritten sheet, run OCR through Groq (Gemini as
              failsafe), and review the AI-assisted rubric grading with
              inline highlighting.
            </p>
          </div>
          <div className="w-72 shrink-0">
            <RubricSelector value={rubricSlug} onChange={setRubricSlug} />
          </div>
        </div>
      </header>

      <hr className="editorial-rule" />

      {/* Split-screen body */}
      {!report ? (
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left — upload or image preview */}
          <section className="space-y-3">
            <div className="eyebrow text-[0.55rem]">Student submission</div>
            {!image ? (
              <UploadPrompt onImageReady={onImageReady} />
            ) : (
              <div className="relative">
                <img
                  src={image.preview}
                  alt="Answer sheet preview"
                  className="w-full bg-muted/30 border border-border rounded-sm object-contain max-h-[480px]"
                />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center bg-background/80 backdrop-blur border border-border text-muted-foreground hover:text-foreground transition-colors rounded-sm"
                  aria-label="Remove image"
                  disabled={grading}
                >
                  <X size={13} />
                </button>
              </div>
            )}
            {image && !grading && (
              <button
                onClick={grade}
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Run grading pipeline
                <ArrowRight size={13} />
              </button>
            )}
          </section>

          {/* Right — placeholder or skeleton */}
          <section className="space-y-3">
            <div className="eyebrow text-[0.55rem]">AI grading & feedback</div>
            {grading ? (
              <GradingSkeleton />
            ) : (
              <div className="empty-state-editorial">
                <p className="font-display text-2xl text-foreground leading-snug">
                  <span className="italic-display text-muted-foreground">
                    Awaiting submission.
                  </span>
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pick a rubric and upload an answer sheet. The AI grading
                  will appear here with score breakdown, missing keywords,
                  and feedback.
                </p>
                <Button
                  onClick={grade}
                  disabled={!image || !rubricSlug || grading}
                  variant="outline"
                  className="border-foreground/15 hover:border-foreground/30 text-sm h-8 mt-1"
                >
                  <Upload size={13} />
                  Grade answer sheet
                </Button>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 fade-in">
          {/* Left — student view */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="eyebrow text-[0.55rem]">Student submission</div>
              {activeKeyword && (
                <button
                  onClick={() => handleKeywordClick(null)}
                  className="text-xs text-amber-700 hover:text-amber-900 transition-colors"
                >
                  Highlighting: <span className="font-mono">{activeKeyword}</span> · clear ×
                </button>
              )}
            </div>
            <StudentView
              evaluations={report.evaluations}
              activeKeyword={activeKeyword}
              activeQuestionId={activeQuestionId}
              onKeywordClick={handleKeywordClick}
            />
          </section>

          {/* Right — AI grading */}
          <section className="space-y-3">
            <div className="eyebrow text-[0.55rem]">AI grading & feedback</div>
            <AiGradingView
              evaluations={report.evaluations}
              totalScore={report.totalScore}
              totalMax={report.totalMax}
              activeKeyword={activeKeyword}
              onKeywordClick={handleKeywordClick}
              onFeedbackUpdated={handleFeedbackUpdate}
            />

            {/* OCR footer */}
            <div className="mt-8 pt-4 border-t border-border space-y-2">
              <div className="flex items-baseline justify-between text-eyebrow text-[0.55rem]">
                <span>Raw OCR · {report.ocr.provider.toUpperCase()}</span>
                <span className="font-mono tabular">
                  {report.ocr.latencyMs}ms · {Object.keys(report.segmented).length} Qs
                </span>
              </div>
              <pre className="text-[0.7rem] font-mono whitespace-pre-wrap text-muted-foreground/80 leading-relaxed max-h-32 overflow-y-auto">
                {report.ocr.text.slice(0, 600)}
                {report.ocr.text.length > 600 ? "…" : ""}
              </pre>
            </div>

            <button
              onClick={() => {
                setReport(null);
                setActiveKeyword(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-4"
            >
              ← Start a new submission
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   UploadPrompt — quiet dropzone, no big icon-in-box.
   ============================================================ */
function UploadPrompt({
  onImageReady,
}: {
  onImageReady: (data: {
    base64: string;
    mimeType: string;
    fileName: string;
  }) => void;
}) {
  return (
    <label
      htmlFor="answer-sheet-input"
      className="block cursor-pointer group"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f, onImageReady);
      }}
    >
      <input
        id="answer-sheet-input"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f, onImageReady);
        }}
      />
      <div className="border border-dashed border-border hover:border-foreground/30 transition-colors rounded-sm px-6 py-12 text-center">
        <p className="font-display text-lg text-foreground mb-1">
          Drop answer sheet here
        </p>
        <p className="text-xs text-muted-foreground">
          or click to browse · PNG, JPG, WEBP
        </p>
      </div>
    </label>
  );
}

function handleFile(
  file: File,
  cb: (data: { base64: string; mimeType: string; fileName: string }) => void
) {
  if (!file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;
    const [meta, b64] = dataUrl.split(",");
    const mimeMatch = /data:(.*?);base64/.exec(meta);
    cb({
      base64: b64,
      mimeType: mimeMatch?.[1] ?? "image/jpeg",
      fileName: file.name,
    });
  };
  reader.readAsDataURL(file);
}

"use client";

/* ============================================================
   OcrOutput — collapsible raw OCR text + segmented view, with a
   copy-to-clipboard button and provider badge (groq | gemini).
   ============================================================ */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Check, ChevronDown, Copy, Eye, FileSearch, Zap } from "lucide-react";
import type { GradingReport } from "@/types";

export function OcrOutput({ report }: { report: GradingReport }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(report.ocr.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const qCount = Object.keys(report.segmented).length;

  return (
    <Card className="card-soft p-0 overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="brand-gradient-bg w-9 h-9 rounded-lg flex items-center justify-center shadow-soft-sm">
              <FileSearch className="text-white" size={18} />
            </span>
            <div>
              <div className="font-medium text-sm">Raw OCR transcript</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="pill bg-brand/10 text-brand">
                  <Zap size={10} />
                  {report.ocr.provider.toUpperCase()}
                </span>
                <span>{report.ocr.latencyMs} ms</span>
                <span>·</span>
                <span>{qCount} questions detected</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={copy} className="h-8">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span className="ml-1 text-xs">Copy</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8">
                <Eye size={14} />
                <span className="ml-1 text-xs">{open ? "Hide" : "View"}</span>
                <ChevronDown
                  size={14}
                  className={`ml-1 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-4 pb-4 grid lg:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Raw transcript
              </div>
              <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/40 rounded-lg p-3 max-h-80 overflow-auto scroll-soft border border-border/60">
                {report.ocr.text}
              </pre>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Segmented answers
              </div>
              <div className="bg-muted/40 rounded-lg p-3 max-h-80 overflow-auto scroll-soft border border-border/60 space-y-3">
                {Object.entries(report.segmented).map(([q, text]) => (
                  <div key={q} className="text-sm">
                    <div className="font-display text-brand text-xs mb-0.5">
                      Question {q}
                    </div>
                    <div className="text-foreground/90 leading-relaxed">
                      {text || (
                        <span className="text-muted-foreground italic">
                          (not detected in transcript)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

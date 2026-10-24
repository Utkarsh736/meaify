"use client";

/* ============================================================
   FeedbackCard — shows AI feedback for one question. Includes
   a "regenerate" button that calls /api/feedback again.
   ============================================================ */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { EvaluationResult } from "@/types";

export function FeedbackCard({ ev }: { ev: EvaluationResult }) {
  const [feedback, setFeedback] = useState(ev.feedback);
  const [regenerating, setRegenerating] = useState(false);

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: ev.question,
          studentAnswer: ev.studentAnswer,
          score: ev.suggestedScore,
          maxMarks: ev.maxMarks,
          missingKeywords: ev.missingKeywords,
        }),
      });
      const data = await res.json();
      if (data.feedback) {
        setFeedback(data.feedback);
        toast.success("Feedback regenerated");
      } else {
        toast.error(data.error ?? "Failed to regenerate");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Card className="card-soft p-4 mt-3 border-l-4 border-l-brand-accent">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
          <MessageSquare size={14} className="text-brand" />
          AI Feedback
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={regenerate}
          disabled={regenerating}
          className="h-7 text-xs"
        >
          {regenerating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
          <span className="ml-1">Regenerate</span>
        </Button>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        {feedback}
      </p>
    </Card>
  );
}

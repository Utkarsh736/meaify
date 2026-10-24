"use client";

/* ============================================================
   StudentView — left pane of the grading workspace.
   ------------------------------------------------------------
   The student's answer is typeset like a document:
     - Serif font (Instrument Serif) for the body text
     - Generous line-height (1.75)
     - Question number as an eyebrow, followed by the question text
       in italic serif, then the student's answer below
     - Active question gets a subtle bg tint and a left rule
     - Keyword highlighting: bg-yellow-500/10 with a left bar
   ============================================================ */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { EvaluationResult } from "@/types";

export function StudentView({
  evaluations,
  activeKeyword,
  activeQuestionId,
  onKeywordClick,
}: {
  evaluations: EvaluationResult[];
  activeKeyword: string | null;
  activeQuestionId: string | null;
  onKeywordClick: (kw: string | null) => void;
}) {
  if (!evaluations.length) {
    return (
      <div className="empty-state-editorial h-full justify-center">
        <p className="font-display text-2xl text-foreground leading-snug">
          <span className="italic-display text-muted-foreground">
            Student submission.
          </span>
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          After grading, the student's segmented answers will appear here
          in typeset form. Click any missing keyword on the right to
          highlight matching text.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {evaluations.map((ev) => {
        const isActive = activeQuestionId === ev.questionId;
        return (
          <article
            key={ev.questionId}
            className={cn(
              "py-6 transition-colors",
              isActive && "bg-primary/[0.03] -mx-4 px-4 rounded-sm"
            )}
          >
            <header className="mb-3">
              <div className="eyebrow text-[0.55rem] mb-1.5">
                Question {ev.questionId}
              </div>
              <p className="font-display text-lg italic text-muted-foreground leading-snug">
                {ev.question}
              </p>
            </header>
            <StudentAnswer
              text={ev.studentAnswer}
              keywords={ev.keywords}
              activeKeyword={activeKeyword}
            />
          </article>
        );
      })}
    </div>
  );
}

function StudentAnswer({
  text,
  keywords,
  activeKeyword,
}: {
  text: string;
  keywords: string[];
  activeKeyword: string | null;
}) {
  const tokens = useMemo(() => tokenize(text), [text]);

  if (!text.trim()) {
    return (
      <p className="text-sm italic text-muted-foreground/70">
        Answer not detected in transcript.
      </p>
    );
  }

  return (
    <div className="font-display text-[1.0625rem] leading-[1.75] text-foreground/90">
      {tokens.map((tok, i) => {
        const isHighlighted =
          activeKeyword &&
          keywords.some(
            (kw) =>
              kw.toLowerCase() === tok.toLowerCase().replace(/[^a-z0-9-]/g, "")
          ) &&
          stemCompare(activeKeyword.toLowerCase(), tok.toLowerCase());
        return (
          <span
            key={i}
            className={cn(
              isHighlighted &&
                "bg-amber-400/15 border-l-2 border-amber-500/60 -ml-0.5 pl-0.5"
            )}
          >
            {tok}
            {i < tokens.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
}

function tokenize(text: string): string[] {
  return text.match(/\S+/g) ?? [];
}

function stemCompare(kw: string, tok: string): boolean {
  const cleanTok = tok.replace(/[^a-z0-9]/g, "");
  return (
    cleanTok === kw ||
    cleanTok.startsWith(kw) ||
    kw.startsWith(cleanTok)
  );
}

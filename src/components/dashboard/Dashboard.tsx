"use client";

/* ============================================================
   Dashboard — asymmetric editorial layout.
   ------------------------------------------------------------
   No 3-card bento grid. Instead:
     - Editorial masthead (large serif heading + subtitle)
     - 7/5 split below: main column (recent tasks) | aside (stats)
     - Quick chat as a quiet inline prompt at the bottom
   All sections breathe — py-12, generous margins.
   ============================================================ */

import { RecentTasks } from "./RecentTasks";
import { StatsAside } from "./StatsAside";
import { QuickChatInline } from "./QuickChatInline";
import type { AppView } from "@/components/layout/AppShell";

export function Dashboard({
  onViewChange,
}: {
  onViewChange: (v: AppView) => void;
}) {
  return (
    <div className="space-y-16 fade-in">
      {/* Editorial masthead */}
      <header className="space-y-3">
        <div className="flex items-center gap-3 text-eyebrow text-[0.55rem]">
          <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-emerald-600" />
          <span>Pipeline ready</span>
          <span className="text-muted-foreground/40">·</span>
          <span>Groq · Gemini · Hugging Face</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-foreground max-w-2xl">
          Handwritten answer grading,{" "}
          <span className="italic-display text-muted-foreground">
            end to end.
          </span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
          A privacy-first workspace for OCR, rubric scoring, AI feedback,
          and a retrieval-aware assistant. Local-first, no auth required.
        </p>
      </header>

      {/* 7/5 asymmetric grid — main column + aside */}
      <section className="grid md:grid-cols-12 gap-12 md:gap-16">
        {/* Main column — recent tasks */}
        <div className="md:col-span-7 space-y-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-foreground">
              Recent work
            </h2>
            <button
              onClick={() => onViewChange("history")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </button>
          </div>
          <hr className="editorial-rule" />
          <RecentTasks onViewChange={onViewChange} limit={6} />
        </div>

        {/* Aside — stats inline */}
        <aside className="md:col-span-5 space-y-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-foreground">Today</h2>
            <span className="text-eyebrow text-[0.55rem]">At a glance</span>
          </div>
          <hr className="editorial-rule" />
          <StatsAside onViewChange={onViewChange} />

          {/* Quiet footer prompt */}
          <div className="pt-8">
            <h3 className="font-display text-lg text-foreground mb-3">
              Ask the assistant
            </h3>
            <QuickChatInline onViewChange={onViewChange} />
          </div>
        </aside>
      </section>

      {/* Inline footer */}
      <footer className="pt-8 border-t border-border flex items-center justify-between text-eyebrow text-[0.55rem]">
        <span>Press ⌘K anywhere for the command palette.</span>
        <span className="text-muted-foreground/60">v1.0 · local-first</span>
      </footer>
    </div>
  );
}

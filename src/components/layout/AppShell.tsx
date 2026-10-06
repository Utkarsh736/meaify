"use client";

/* ============================================================
   AppShell — top-nav layout (NOT sidebar) so the app feels like
   a modern dashboard and works on mobile.

   Tab navigation is internal — we keep everything on /  per the
   fullstack-dev skill's "user can only see the / route" rule.
   ============================================================ */

import { LogoWordmark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  MessageSquare,
  FileText,
  History,
  Settings,
} from "lucide-react";

export type AppTab = "grade" | "chat" | "rubric" | "history" | "settings";

const TABS: Array<{ id: AppTab; label: string; icon: typeof GraduationCap }> = [
  { id: "grade", label: "Grade", icon: GraduationCap },
  { id: "chat", label: "Assistant", icon: MessageSquare },
  { id: "rubric", label: "Rubrics", icon: FileText },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AppShell({
  active,
  onTabChange,
  children,
}: {
  active: AppTab;
  onTabChange: (t: AppTab) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header */}
      <header className="glass-soft sticky top-0 z-40 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <LogoWordmark />
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onTabChange(t.id)}
                  className={cn(
                    "pill h-9 px-3 sm:px-4 transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            <span className="brand-gradient-text font-display">MEAIFY</span> ·
            Handwritten answer grading · Groq + Gemini
          </span>
          <span>SQLite · Next.js 16 · Web Speech API</span>
        </div>
      </footer>
    </div>
  );
}

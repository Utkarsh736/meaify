"use client";

/* ============================================================
   AppShell — editorial masthead + minimal sidebar.
   ------------------------------------------------------------
   Top bar: thin horizontal rule under the wordmark + meta.
   Sidebar: text-only nav, no icons, no background, right-border.
   Active state: a single ink-blue dot to the left of the label.

   The whole layout breathes — generous padding, content max-w
   constrained so lines don't get unreadable on ultrawide.
   ============================================================ */

import { useEffect, useState } from "react";
import { LogoWordmark } from "@/components/brand/Logo";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { cn } from "@/lib/utils";

export type AppView =
  | "dashboard"
  | "grade"
  | "assistant"
  | "rubric"
  | "history"
  | "settings";

interface NavItem {
  id: AppView;
  label: string;
  index: string; // 01, 02, ... shown in monospace
}

// Editorial navigation — text labels only, numbered like a TOC.
const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", index: "01" },
  { id: "grade", label: "Grade", index: "02" },
  { id: "assistant", label: "Assistant", index: "03" },
  { id: "rubric", label: "Rubrics", index: "04" },
  { id: "history", label: "History", index: "05" },
  { id: "settings", label: "Settings", index: "06" },
];

export function AppShell({
  active,
  onViewChange,
  children,
}: {
  active: AppView;
  onViewChange: (v: AppView) => void;
  children: React.ReactNode;
}) {
  const [cmdOpen, setCmdOpen] = useState(false);

  // Cmd/Ctrl+K — opens command palette
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Masthead — thin top bar */}
      <header className="border-b border-border">
        <div className="page-margin flex items-center justify-between h-14">
          <div className="flex items-baseline gap-3">
            <LogoWordmark />
            <span className="hidden sm:inline eyebrow text-[0.55rem] opacity-70">
              Multimodal Education AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* Status indicator — calm dot pulse */}
            <span className="hidden md:inline-flex items-center gap-2 text-eyebrow text-[0.55rem]">
              <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span>Pipeline ready</span>
            </span>
            <button
              onClick={() => setCmdOpen(true)}
              className="inline-flex items-center gap-2 px-2.5 h-7 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-colors rounded-sm"
              aria-label="Open command palette"
            >
              <span>Search</span>
              <kbd className="font-mono text-[0.6rem] tracking-wider opacity-60">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Body — sidebar + main */}
      <div className="flex-1 flex">
        {/* Sidebar — text-only nav, no icons, no bg color */}
        <aside className="hidden md:block w-52 shrink-0 border-r border-border">
          <nav className="page-margin py-8 flex flex-col gap-1">
            <span className="eyebrow mb-3 text-[0.55rem] opacity-60">
              Workspace
            </span>
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "group relative flex items-baseline gap-3 py-1.5 text-sm transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Active indicator — small dot to the left */}
                  <span
                    className={cn(
                      "absolute -left-3 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full transition-opacity",
                      isActive
                        ? "bg-primary opacity-100"
                        : "opacity-0 group-hover:opacity-40"
                    )}
                  />
                  <span
                    className={cn(
                      "font-mono text-[0.55rem] tracking-wider tabular",
                      isActive ? "text-primary" : "text-muted-foreground/60"
                    )}
                  >
                    {item.index}
                  </span>
                  <span className={isActive ? "font-medium" : ""}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav — horizontal scroll */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border overflow-x-auto">
          <div className="flex items-center gap-1 px-3 h-12">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "px-2.5 py-1 text-xs whitespace-nowrap transition-colors",
                    isActive
                      ? "text-foreground border-b border-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
          <div className="page-margin py-8 md:py-12">{children}</div>
        </main>
      </div>

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onViewChange={onViewChange}
      />
    </div>
  );
}

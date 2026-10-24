"use client";

/* ============================================================
   Single-page app entry — sidebar + view switcher.
   All views live on the / route (per the fullstack-dev skill's
   "user can only see /" rule).
   ============================================================ */

import { useState } from "react";
import { AppShell, type AppView } from "@/components/layout/AppShell";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { GradingTab } from "@/components/grade/GradingTab";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { RubricPanel } from "@/components/rubric/RubricPanel";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { SettingsPanel } from "@/components/rubric/SettingsPanel";

export default function Home() {
  const [view, setView] = useState<AppView>("dashboard");

  return (
    <AppShell active={view} onViewChange={setView}>
      {view === "dashboard" && <Dashboard onViewChange={setView} />}
      {view === "grade" && <GradingTab />}
      {view === "assistant" && <ChatPanel />}
      {view === "rubric" && <RubricPanel />}
      {view === "history" && <HistoryPanel onViewChange={setView} />}
      {view === "settings" && <SettingsPanel />}
    </AppShell>
  );
}

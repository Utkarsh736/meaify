"use client";

/* ============================================================
   Single-page app entry — tabs live entirely on the / route
   (per the fullstack-dev skill's "user can only see /" rule).
   ============================================================ */

import { useState } from "react";
import { AppShell, type AppTab } from "@/components/layout/AppShell";
import { GradingTab } from "@/components/grade/GradingTab";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { RubricPanel } from "@/components/rubric/RubricPanel";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { SettingsPanel } from "@/components/rubric/SettingsPanel";

export default function Home() {
  const [tab, setTab] = useState<AppTab>("grade");

  return (
    <AppShell active={tab} onTabChange={setTab}>
      {tab === "grade" && <GradingTab />}
      {tab === "chat" && <ChatPanel />}
      {tab === "rubric" && <RubricPanel />}
      {tab === "history" && <HistoryPanel />}
      {tab === "settings" && <SettingsPanel />}
    </AppShell>
  );
}

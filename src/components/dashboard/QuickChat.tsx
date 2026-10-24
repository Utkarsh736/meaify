"use client";

/* ============================================================
   QuickChat — mini RAG bot input embedded in the dashboard.
   ------------------------------------------------------------
   A single-line input that sends to /api/chat and shows the
   reply inline. Clicking "Open full chat" → switches to the
   Assistant view.
   ============================================================ */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { AppView } from "@/components/layout/AppShell";

export function QuickChat({
  onViewChange,
}: {
  onViewChange: (v: AppView) => void;
}) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setReply(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim(), history: [] }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Chat unavailable");
        return;
      }
      setReply(data.reply);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-muted-foreground" />
          <h3 className="text-sm font-medium">Quick chat</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange("assistant")}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Open full chat
          <ArrowRight size={12} />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Ask the rubric assistant about grading, missing keywords, or how to
        improve an answer.
      </p>

      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask anything about your grading…"
          className="bg-background/40 border-border text-sm"
          disabled={loading}
        />
        <Button
          onClick={send}
          disabled={loading || !input.trim()}
          variant="outline"
          size="icon"
          className="card-hover h-9 w-9"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ArrowRight size={14} />
          )}
        </Button>
      </div>

      {reply && (
        <div className="mt-4 rounded-lg border border-border bg-background/30 p-3.5 text-sm leading-relaxed">
          <div className="flex items-start gap-2">
            <Sparkles size={13} className="text-primary mt-0.5 shrink-0" />
            <p className="text-foreground/90">{reply}</p>
          </div>
        </div>
      )}
    </div>
  );
}

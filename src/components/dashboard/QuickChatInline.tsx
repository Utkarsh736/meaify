"use client";

/* ============================================================
   QuickChatInline — quiet inline prompt, no card chrome.
   ------------------------------------------------------------
   A single-line input with a placeholder, sends to /api/chat,
   shows the reply inline below. Clicking the prompt header takes
   the user to the full Assistant view.
   ============================================================ */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { AppView } from "@/components/layout/AppShell";

export function QuickChatInline({
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
    <div className="space-y-3">
      <div className="relative">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask about a question, your grade…"
          className="bg-transparent border-border pr-9 h-9 text-sm"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
          aria-label="Send message"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <ArrowRight size={13} />
          )}
        </button>
      </div>

      {reply && (
        <div className="text-sm text-foreground/85 leading-relaxed border-l border-primary/30 pl-3 italic">
          {reply}
        </div>
      )}

      <button
        onClick={() => onViewChange("assistant")}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Open full chat →
      </button>
    </div>
  );
}

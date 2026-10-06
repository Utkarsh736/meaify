"use client";

/* ============================================================
   ChatPanel — the assistant tab.
   ------------------------------------------------------------
   - Pre-built system prompt pulls in latest grading report
   - Voice input (Web Speech API → Groq Whisper fallback)
   - Voice output (Web Speech Synthesis)
   - Streaming-like typing indicator
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MessageBubble } from "./MessageBubble";
import { VoiceControls } from "./VoiceControls";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ChatPanel({ rubricSlug }: { rubricSlug?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Hi! I'm your rubric assistant. Ask me about your grade, a specific question, or how to improve your answer. You can also tap the mic to talk.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const synth = useSpeechSynthesis({ enabled: true, rate: 1 });
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const history = messages
        .filter((m) => m.role !== "system")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, rubricSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Chat failed");
        return;
      }
      const reply: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: data.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, reply]);
      // Speak the reply (only if TTS is on; the VoiceControls widget
      // controls its own TTS state — this is for the keyboard flow).
      synth.speak(data.reply);
      setSpeakingId(reply.id);
      setTimeout(() => setSpeakingId(null), 2000);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function speak(text: string) {
    synth.speak(text);
  }

  function clearChat() {
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content: "Chat cleared. How can I help?",
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  return (
    <Card className="card-soft p-0 overflow-hidden flex flex-col h-[640px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-gradient-to-r from-brand/5 to-brand-accent/10">
        <div className="flex items-center gap-2">
          <span className="brand-gradient-bg w-8 h-8 rounded-lg flex items-center justify-center shadow-soft-sm">
            <Bot className="text-white" size={16} />
          </span>
          <div>
            <div className="font-display text-sm">Rubric Assistant</div>
            <div className="text-xs text-muted-foreground">
              {rubricSlug ? `Context: ${rubricSlug}` : "General chat"} · Groq→Gemini fallback
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat} className="h-8 text-xs">
          <Trash2 size={13} /> Clear
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-soft p-4 space-y-4">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            msg={m}
            onSpeak={speak}
            speaking={speakingId === m.id}
          />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader2 size={12} className="animate-spin" />
            <span>Assistant is thinking…</span>
          </div>
        )}
      </div>

      {/* Voice controls */}
      <VoiceControls
        onUserMessage={send}
        assistantText={messages[messages.length - 1]?.content ?? ""}
        rubricSlug={rubricSlug}
      />

      {/* Text input */}
      <div className="p-3 border-t border-border/60 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask about a question, your grade, or how to improve…"
          className="h-10"
          disabled={loading}
        />
        <Button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="brand-gradient-bg text-white h-10 w-10 p-0 shadow-soft-sm hover:shadow-soft-md"
          size="icon"
        >
          <Send size={16} />
        </Button>
      </div>
    </Card>
  );
}

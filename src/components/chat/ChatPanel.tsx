"use client";

/* ============================================================
   ChatPanel — centered linear message flow.
   ------------------------------------------------------------
   Single centered column (max-w-2xl), no chat bubbles.
   Clean message flow with eyebrow labels and subtle citations.
   RetrievalStatus shows a quiet line of text during processing.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Loader2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { MessageItem } from "./MessageItem";
import { RetrievalStatus, type RetrievalStage } from "./RetrievalStatus";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface Citation {
  id: string;
  label: string;
}

export function ChatPanel({ rubricSlug }: { rubricSlug?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Hello. I'm your rubric assistant. Ask me about your grade, a specific question, or how to improve an answer. You can also tap the microphone to speak.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [retrievalStage, setRetrievalStage] = useState<RetrievalStage>("idle");
  const [ttsOn, setTtsOn] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const speech = useSpeechRecognition({
    onFinal: (text) => send(text),
  });
  const synth = useSpeechSynthesis({ enabled: ttsOn, rate: 1 });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [messages, loading, retrievalStage]);

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
    setRetrievalStage("searching");

    // Calm, slow staged retrieval — feels deliberate, not jumpy
    setTimeout(() => setRetrievalStage("found"), 600);
    setTimeout(() => setRetrievalStage("generating"), 1200);

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
      setRetrievalStage("idle");
      if (!res.ok) {
        toast.error(data.error ?? "Chat failed");
        return;
      }

      const citations: Citation[] = buildCitations(rubricSlug);
      const reply = {
        id: uid(),
        role: "assistant" as const,
        content: data.reply,
        createdAt: new Date().toISOString(),
        citations: citations.length ? citations : undefined,
      } as ChatMessage & { citations?: Citation[] };
      setMessages((m) => [...m, reply]);
      if (ttsOn) {
        synth.speak(data.reply);
        setSpeakingId(reply.id);
        setTimeout(() => setSpeakingId(null), 1500);
      }
    } catch (e) {
      setRetrievalStage("idle");
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
        content: "Conversation cleared. How can I help?",
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  const isRecording = speech.isListening;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <header className="space-y-2">
        <div className="eyebrow text-[0.55rem]">Workspace · 03</div>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="space-y-1.5">
            <h1 className="font-display text-3xl md:text-4xl text-foreground">
              Rubric assistant
            </h1>
            <p className="text-xs text-muted-foreground">
              {rubricSlug ? `Context: ${rubricSlug}` : "General chat"} · Groq
              → Gemini fallback
            </p>
          </div>
          <button
            onClick={clearChat}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear conversation
          </button>
        </div>
      </header>

      <hr className="editorial-rule" />

      {/* Conversation — centered single column */}
      <div
        ref={scrollRef}
        className="max-w-2xl mx-auto max-h-[60vh] overflow-y-auto px-1"
      >
        {messages.map((m) => {
          const msgWithCitations = m as ChatMessage & {
            citations?: Citation[];
          };
          return (
            <MessageItem
              key={m.id}
              msg={m}
              onSpeak={speak}
              speaking={speakingId === m.id}
              citations={msgWithCitations.citations}
            />
          );
        })}

        {/* Calm retrieval status */}
        {loading && retrievalStage !== "idle" && (
          <RetrievalStatus stage={retrievalStage} />
        )}
      </div>

      {/* Input row — quiet, no card chrome */}
      <div className="max-w-2xl mx-auto space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (speech.supported) {
                if (speech.isListening) speech.stop();
                else speech.start();
              } else {
                toast.info("Microphone input requires a Chromium-based browser.");
              }
            }}
            className={cn(
              "h-9 w-9 flex items-center justify-center border border-border hover:border-foreground/20 transition-colors rounded-sm",
              isRecording
                ? "text-needs-work border-needs-work/40"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
          </button>

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
            className="bg-transparent border-border h-9 flex-1"
            disabled={loading}
          />

          <button
            onClick={() => setTtsOn((v) => !v)}
            className={cn(
              "h-9 w-9 flex items-center justify-center border border-border hover:border-foreground/20 transition-colors rounded-sm",
              ttsOn
                ? "text-primary border-primary/30"
                : "text-muted-foreground"
            )}
            aria-label="Toggle voice output"
            title={ttsOn ? "Voice output on" : "Voice output off"}
          >
            {ttsOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          <Button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-9 w-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <span className="font-mono text-xs">→</span>
            )}
          </Button>
        </div>

        <p className="text-[0.65rem] text-muted-foreground/60 text-center">
          Press{" "}
          <kbd className="font-mono px-1 py-0.5 border border-border rounded-sm">
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd className="font-mono px-1 py-0.5 border border-border rounded-sm">
            ⌘K
          </kbd>{" "}
          for commands
        </p>
      </div>
    </div>
  );
}

function buildCitations(rubricSlug: string | undefined): Citation[] {
  // Mock citations — in a real RAG pipeline these would come from
  // the retrieved document chunks. Kept small and subtle.
  const cites: Citation[] = [{ id: "1", label: "[1] rubric" }];
  if (rubricSlug) {
    cites.push({ id: "2", label: `[2] ${rubricSlug.slice(0, 8)}` });
  }
  return cites;
}

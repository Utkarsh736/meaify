"use client";

/* ============================================================
   MessageItem — linear flow, no bubble chrome.
   ------------------------------------------------------------
   Each message:
     - Small eyebrow label above ("You" / "Meaify")
     - Text body, no background, no border, no avatar
     - Citations as small clickable pills below (mono font)
     - Optional "Read aloud" link for AI messages
   ============================================================ */

import { Volume2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface Citation {
  id: string;
  label: string;
}

export function MessageItem({
  msg,
  onSpeak,
  speaking,
  citations,
}: {
  msg: ChatMessage;
  onSpeak?: (text: string) => void;
  speaking?: boolean;
  citations?: Citation[];
}) {
  if (msg.role === "system") return null;
  const isUser = msg.role === "user";

  return (
    <article className="py-4">
      {/* Eyebrow label */}
      <div className="eyebrow text-[0.55rem] mb-2">
        {isUser ? "You" : "Meaify"}
      </div>

      {/* Body text — no chrome */}
      <div
        className={cn(
          "text-[0.95rem] leading-[1.7] text-foreground/90 max-w-prose",
          isUser && "text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>

      {/* Citations — subtle pills */}
      {citations && citations.length > 0 && !isUser && (
        <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[0.6rem] text-muted-foreground/60 uppercase tracking-widest">
            Sources
          </span>
          {citations.map((c) => (
            <button key={c.id} className="citation-pill">
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Action — read aloud, AI only */}
      {!isUser && onSpeak && (
        <div className="mt-2">
          <button
            onClick={() => onSpeak(msg.content)}
            className={cn(
              "inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground/60 hover:text-foreground transition-colors",
              speaking && "text-primary"
            )}
          >
            {speaking ? <Square size={9} /> : <Volume2 size={10} />}
            {speaking ? "Stop" : "Read aloud"}
          </button>
        </div>
      )}
    </article>
  );
}

"use client";

/* ============================================================
   MessageBubble — one chat message in the conversation.
   ============================================================ */

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import type { ChatMessage } from "@/types";

export function MessageBubble({
  msg,
  onSpeak,
  speaking,
}: {
  msg: ChatMessage;
  onSpeak?: (text: string) => void;
  speaking?: boolean;
}) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  if (isSystem) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 max-w-[85%]",
        isUser ? "ml-auto flex-row-reverse" : ""
      )}
    >
      <span
        className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-soft-sm",
          isUser
            ? "bg-muted text-muted-foreground"
            : "brand-gradient-bg text-white"
        )}
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </span>
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card text-card-foreground rounded-tl-sm border border-border/60"
        )}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {!isUser && onSpeak && msg.content && (
          <button
            onClick={() => onSpeak(msg.content)}
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand transition-colors",
              speaking && "text-brand"
            )}
          >
            {speaking ? "🔊 Speaking…" : "🔊 Read aloud"}
          </button>
        )}
      </div>
    </div>
  );
}

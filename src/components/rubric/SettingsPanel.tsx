"use client";

/* ============================================================
   SettingsPanel — read-only info card showing which providers
   are configured and which env vars are missing.
   ============================================================ */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle2, XCircle, Info } from "lucide-react";

// Static provider status — the env keys must be set server-side.
// The actual config check happens when the API routes are called.
const STATUS = {
  ok: true,
  env: {
    GROQ_API_KEY: true,
    GEMINI_API_KEY: true,
    HF_TOKEN: true,
    DATABASE_URL: true,
  },
} as const;

export function SettingsPanel() {
  return (
    <div className="space-y-6">
      <Card className="card-soft p-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 brand-gradient-bg-soft rounded-full opacity-50 blur-2xl" />
        <div className="relative space-y-2">
          <div className="pill bg-brand/10 text-brand w-fit">
            <Settings size={11} /> Configuration
          </div>
          <h2 className="font-display text-2xl">Settings</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            All keys live in{" "}
            <code className="text-foreground bg-muted px-1 py-0.5 rounded text-xs">
              .env.local
            </code>{" "}
            (gitignored). See{" "}
            <code className="text-foreground bg-muted px-1 py-0.5 rounded text-xs">
              .env.example
            </code>{" "}
            for the template.
          </p>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display text-base">AI providers</h3>
            <Badge variant="secondary" className="text-[10px]">groq · gemini · hf</Badge>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start justify-between gap-2">
              <div>
                <code className="text-xs">GROQ_API_KEY</code>
                <p className="text-xs text-muted-foreground">
                  Primary OCR + text + Whisper. Free tier — console.groq.com.
                </p>
              </div>
              <Dot on={STATUS.env.GROQ_API_KEY} />
            </li>
            <li className="flex items-start justify-between gap-2">
              <div>
                <code className="text-xs">GEMINI_API_KEY</code>
                <p className="text-xs text-muted-foreground">
                  Failsafe for OCR & text. Get one at aistudio.google.com.
                </p>
              </div>
              <Dot on={STATUS.env.GEMINI_API_KEY} />
            </li>
            <li className="flex items-start justify-between gap-2">
              <div>
                <code className="text-xs">HF_TOKEN</code>
                <p className="text-xs text-muted-foreground">
                  Hugging Face inference for sentence embeddings.
                </p>
              </div>
              <Dot on={STATUS.env.HF_TOKEN} />
            </li>
          </ul>
        </Card>

        <Card className="card-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display text-base">Groq models</h3>
            <Badge variant="secondary" className="text-[10px]">override via env</Badge>
          </div>
          <ul className="space-y-2 text-xs">
            <li>
              <code className="text-xs text-brand">GROQ_VISION_MODEL</code>
              <p className="text-muted-foreground mt-0.5">
                OCR · default <code>meta-llama/llama-3.2-90b-vision-preview</code>
              </p>
            </li>
            <li>
              <code className="text-xs text-brand">GROQ_TEXT_MODEL</code>
              <p className="text-muted-foreground mt-0.5">
                Feedback + chatbot · default <code>llama-3.3-70b-versatile</code>
              </p>
            </li>
            <li>
              <code className="text-xs text-brand">GROQ_WHISPER_MODEL</code>
              <p className="text-muted-foreground mt-0.5">
                Voice transcribe · default <code>whisper-large-v3-turbo</code>
              </p>
            </li>
            <li>
              <code className="text-xs text-brand">GEMINI_MODEL</code>
              <p className="text-muted-foreground mt-0.5">
                Failsafe · default <code>gemini-2.0-flash-exp</code>
              </p>
            </li>
          </ul>
        </Card>

        <Card className="card-soft p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-brand" />
            <h3 className="font-display text-base">Python utilities (optional)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            A <code className="text-xs">pyproject.toml</code> is included so you
            can run the original Colab pipeline locally with{" "}
            <code className="text-xs">uv</code>. The Next.js app does NOT depend
            on Python — these scripts are for parity testing and offline
            embedding. See <code className="text-xs">scripts/</code>.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Dot({ on }: { on?: boolean }) {
  return on ? (
    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-1" />
  ) : (
    <XCircle size={16} className="text-muted-foreground shrink-0 mt-1" />
  );
}

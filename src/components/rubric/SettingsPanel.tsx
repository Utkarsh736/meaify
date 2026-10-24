"use client";

/* ============================================================
   SettingsPanel — config info, editorial calm.
   ============================================================ */

import {
  CheckCircle2,
  XCircle,
} from "lucide-react";

const STATUS = {
  env: {
    GROQ_API_KEY: true,
    GEMINI_API_KEY: true,
    HF_TOKEN: true,
    DATABASE_URL: true,
  },
} as const;

export function SettingsPanel() {
  return (
    <div className="space-y-8 fade-in">
      <header className="space-y-2">
        <div className="eyebrow text-[0.55rem]">Workspace · 06</div>
        <h1 className="font-display text-3xl md:text-4xl text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
          All keys live in{" "}
          <code className="font-mono text-xs">.env.local</code> (gitignored).
          See <code className="font-mono text-xs">.env.example</code> for the
          template.
        </p>
      </header>

      <hr className="editorial-rule" />

      <div className="grid md:grid-cols-2 gap-12 max-w-5xl">
        {/* Providers */}
        <section className="space-y-4">
          <h2 className="font-display text-xl text-foreground">Providers</h2>
          <ul className="space-y-4">
            <ProviderRow
              envKey="GROQ_API_KEY"
              description="Primary OCR + text + Whisper. Free tier — console.groq.com."
              ok={STATUS.env.GROQ_API_KEY}
            />
            <ProviderRow
              envKey="GEMINI_API_KEY"
              description="Failsafe for OCR & text. aistudio.google.com."
              ok={STATUS.env.GEMINI_API_KEY}
            />
            <ProviderRow
              envKey="HF_TOKEN"
              description="Hugging Face inference for sentence embeddings."
              ok={STATUS.env.HF_TOKEN}
            />
          </ul>
        </section>

        {/* Models */}
        <section className="space-y-4">
          <h2 className="font-display text-xl text-foreground">Models</h2>
          <ul className="space-y-4">
            <ModelRow
              envKey="GROQ_VISION_MODEL"
              defaultValue="meta-llama/llama-3.2-90b-vision-preview"
              purpose="OCR"
            />
            <ModelRow
              envKey="GROQ_TEXT_MODEL"
              defaultValue="llama-3.3-70b-versatile"
              purpose="Feedback + chat"
            />
            <ModelRow
              envKey="GROQ_WHISPER_MODEL"
              defaultValue="whisper-large-v3-turbo"
              purpose="Voice transcribe"
            />
            <ModelRow
              envKey="GEMINI_MODEL"
              defaultValue="gemini-2.0-flash-exp"
              purpose="Failsafe"
            />
          </ul>
        </section>

        {/* Theming */}
        <section className="space-y-3 md:col-span-2">
          <h2 className="font-display text-xl text-foreground">Theming</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            All theme tokens live in{" "}
            <code className="font-mono text-xs">src/app/globals.css</code>{" "}
            under <code className="font-mono text-xs">:root</code>. Edit{" "}
            <code className="font-mono text-xs">--background</code>,{" "}
            <code className="font-mono text-xs">--primary</code>,{" "}
            <code className="font-mono text-xs">--border</code>, or{" "}
            <code className="font-mono text-xs">--radius</code> to reskin
            the entire app. Swap fonts via the{" "}
            <code className="font-mono text-xs">--font-display</code> and{" "}
            <code className="font-mono text-xs">--font-sans</code> lines.
          </p>
        </section>

        {/* Keyboard shortcuts */}
        <section className="space-y-3 md:col-span-2">
          <h2 className="font-display text-xl text-foreground">
            Keyboard shortcuts
          </h2>
          <ul className="text-sm space-y-2 max-w-md">
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">
                Open command palette
              </span>
              <kbd className="font-mono px-1.5 py-0.5 border border-border rounded-sm text-xs">
                ⌘K
              </kbd>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">Go to Dashboard</span>
              <kbd className="font-mono px-1.5 py-0.5 border border-border rounded-sm text-xs">
                G D
              </kbd>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">Go to Grade</span>
              <kbd className="font-mono px-1.5 py-0.5 border border-border rounded-sm text-xs">
                G G
              </kbd>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">Send chat message</span>
              <kbd className="font-mono px-1.5 py-0.5 border border-border rounded-sm text-xs">
                Enter
              </kbd>
            </li>
          </ul>
        </section>

        {/* Python */}
        <section className="space-y-3 md:col-span-2">
          <h2 className="font-display text-xl text-foreground">
            Python utilities
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            A{" "}
            <code className="font-mono text-xs">pyproject.toml</code> is
            included so you can run the original Colab pipeline locally
            with{" "}
            <code className="font-mono text-xs">uv</code>. The Next.js app
            does not depend on Python — these scripts are for parity
            testing and offline embedding. See{" "}
            <code className="font-mono text-xs">scripts/</code>.
          </p>
        </section>
      </div>
    </div>
  );
}

function ProviderRow({
  envKey,
  description,
  ok,
}: {
  envKey: string;
  description: string;
  ok: boolean;
}) {
  return (
    <li className="flex items-baseline justify-between gap-2">
      <div className="flex-1">
        <code className="text-sm text-foreground font-mono">{envKey}</code>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {ok ? (
        <CheckCircle2 size={14} className="text-excellent shrink-0" />
      ) : (
        <XCircle size={14} className="text-muted-foreground shrink-0" />
      )}
    </li>
  );
}

function ModelRow({
  envKey,
  defaultValue,
  purpose,
}: {
  envKey: string;
  defaultValue: string;
  purpose: string;
}) {
  return (
    <li>
      <code className="text-sm text-primary font-mono">{envKey}</code>
      <p className="text-xs text-muted-foreground mt-0.5">
        {purpose} · default{" "}
        <code className="text-foreground/80">{defaultValue}</code>
      </p>
    </li>
  );
}

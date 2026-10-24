# MEAIFY — Handwritten Answer Grading

> Upload a handwritten answer sheet → AI-assisted OCR → rubric grading → AI feedback → voice-enabled chatbot.

**Meaify** is an AI-assisted exam evaluator for teachers. Point it at a photo of a handwritten answer sheet; it runs OCR, scores against a rubric, generates per-question feedback, and keeps a voice-enabled assistant for follow-up questions.

Built with **Next.js 16 · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma + SQLite**.  
Powered by **Groq** (primary) with **Gemini** as failsafe and **Hugging Face** for embeddings.

## Features

- **Vision OCR** — Groq vision models with Gemini fallback for handwritten sheets.
- **Hybrid rubric scoring** — `0.6 × semantic similarity + 0.4 × keyword match`, with Porter-stemmer tolerant matching.
- **AI feedback** — regeneratable per-question feedback grounded in the rubric.
- **Voice chatbot** — Web Speech API for input/output; Groq Whisper fallback when the browser lacks SpeechRecognition.
- **Dashboard** — overview of recent tasks, quick chat, and stats.
- **Command palette** — fast navigation and actions (`⌘K` / `Ctrl+K`).
- **Rubric manager** — rubrics live as JSON files under `/rubrics/`; easy to version and switch.
- **Grading history** — every submission persisted to SQLite via Prisma.
- **Editorial UI** — clean academic modernism (warm off-white, deep ink, generous spacing).

## Screenshots

Screenshots live in [`download/`](./download/). They show the dashboard, grade view (split-screen), assistant, rubrics, history, settings, and command palette.

## Quick start

```bash
# 1. Install JavaScript dependencies
bun install          # or: npm install / pnpm install

# 2. Configure environment
cp .env.example .env.local
# edit .env.local — add GROQ_API_KEY (and optionally GEMINI_API_KEY, HF_TOKEN)

# 3. Push the SQLite schema
bun run db:push      # or: npm run db:push

# 4. Run the dev server
bun run dev          # → http://localhost:3000
```

### Optional Python utilities

The Next.js app does **not** require Python. The `pyproject.toml` + `uv.lock` exist so you can run the original Colab-style pipeline or offline embeddings:

```bash
uv sync
uv run python scripts/notebook_pipeline.py
```

## Project structure

```
.
├── src/
│   ├── app/
│   │   ├── api/                 # OCR, grade, feedback, chat, transcribe, rubric, history
│   │   ├── globals.css          # Theme tokens (edit to reskin)
│   │   ├── layout.tsx
│   │   └── page.tsx             # Single-page app (dashboard / grade / assistant / …)
│   ├── components/
│   │   ├── brand/               # Logo
│   │   ├── dashboard/           # Dashboard, stats, recent tasks, quick chat
│   │   ├── grade/               # Upload, OCR, scoring, feedback, split views
│   │   ├── chat/                # Chat panel, voice controls
│   │   ├── layout/              # AppShell, CommandPalette
│   │   ├── rubric/              # Rubric browser + settings
│   │   ├── history/             # Submission history
│   │   └── ui/                  # shadcn/ui primitives
│   ├── hooks/                   # Speech recognition / synthesis
│   ├── lib/
│   │   ├── ai/                  # Groq, Gemini, OCR, embeddings, feedback
│   │   ├── grading/             # Stemmer, segmenter, evaluator, similarity
│   │   ├── rubric/              # JSON rubric loader
│   │   └── db/                  # Prisma client + queries
│   └── types/
├── prisma/schema.prisma
├── rubrics/                     # data-science.json, mathematics.json, …
├── scripts/                     # UV-managed Python helpers (optional)
├── download/                    # UI screenshots
├── pyproject.toml               # Optional Python utils
├── uv.lock
└── package.json
```

## Configuration

| Variable | Purpose | Where to get |
| --- | --- | --- |
| `GROQ_API_KEY` | Vision OCR + text + Whisper | https://console.groq.com |
| `GEMINI_API_KEY` | Failsafe for OCR & text | https://aistudio.google.com |
| `HF_TOKEN` | Sentence embeddings | https://huggingface.co/settings/tokens |
| `DATABASE_URL` | SQLite path | Default: `file:./prisma/dev.db` |

Optional model overrides (see `.env.example`):  
`GROQ_VISION_MODEL`, `GROQ_TEXT_MODEL`, `GROQ_WHISPER_MODEL`, `GEMINI_MODEL`.

All keys are optional; the app degrades gracefully when a provider is missing.

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start Next.js dev server on port 3000 |
| `bun run build` | Production build (standalone output) |
| `bun run start` | Run the standalone production server |
| `bun run db:push` | Push Prisma schema to SQLite |
| `bun run db:generate` | Generate Prisma client |
| `bun run lint` | ESLint |

## Tech notes

- **Standalone output** — `next.config.ts` sets `output: "standalone"` for easy container / single-binary deploys.
- **Rubrics** — plain JSON under `/rubrics/`. Drop a new file and it appears in the UI.
- **Database** — SQLite keeps the project self-contained; swap `DATABASE_URL` for Postgres if you need multi-user production later.
- **Voice** — prefers the browser Web Speech API; falls back to Groq Whisper for transcription when needed.

## License

MIT (or your preferred license — update this section as needed).

---

Built with ❤️ for teachers who grade by hand.

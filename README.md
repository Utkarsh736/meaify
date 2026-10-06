# MEAIFY — Handwritten Answer Grading

> Upload a handwritten answer sheet → AI-assisted OCR → rubric grading → AI feedback → voice-enabled chatbot.

Built with **Next.js 16 · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma + SQLite**.
Powered by **Groq (free tier)** with **Gemini as failsafe** and **Hugging Face inference** for embeddings.

## Features

- **Vision OCR** (Groq → Gemini fallback) on handwritten answer sheets.
- **Hybrid rubric scoring** — `0.6 × semantic similarity + 0.4 × keyword match`, with Porter-stemmer tolerant keyword matching.
- **AI feedback** per question, regeneratable with one click.
- **Voice chatbot** — Web Speech API for input/output, with Groq Whisper fallback when browsers lack SpeechRecognition.
- **Rubric manager** — rubrics live as JSON files in `/rubrics/`, easy to git-track and switch.
- **Grading history** — every submission persists to SQLite via Prisma.

## Quick start

```bash
# 1. Install deps
bun install

# 2. Configure env
cp .env.example .env.local
# edit .env.local and add your GROQ_API_KEY, GEMINI_API_KEY, HF_TOKEN

# 3. Push the SQLite schema
bun run db:push

# 4. Run the dev server
bun run dev
# → http://localhost:3000
```

## Project structure

```
.
├── src/
│   ├── app/
│   │   ├── api/                   # API routes
│   │   │   ├── ocr/route.ts       # POST /api/ocr
│   │   │   ├── grade/route.ts     # POST /api/grade  (main pipeline)
│   │   │   ├── feedback/route.ts  # POST /api/feedback
│   │   │   ├── chat/route.ts      # POST /api/chat
│   │   │   ├── transcribe/route.ts # POST /api/transcribe (Groq Whisper)
│   │   │   ├── rubric/route.ts    # GET/POST /api/rubric
│   │   │   └── history/route.ts   # GET /api/history
│   │   ├── globals.css            # ★ Theme tokens — edit to reskin
│   │   ├── layout.tsx             # Belleza font + metadata
│   │   └── page.tsx               # Single-page app w/ tabs
│   ├── components/
│   │   ├── brand/Logo.tsx         # Gradient brand mark
│   │   ├── layout/AppShell.tsx    # Top-nav shell
│   │   ├── grade/                 # Upload, RubricSelector, ScoreBreakdown, FeedbackCard, GradingReport, OcrOutput
│   │   ├── chat/                   # ChatPanel, MessageBubble, VoiceControls
│   │   ├── rubric/RubricPanel.tsx # Browse / preview / edit rubric JSON
│   │   ├── history/HistoryPanel.tsx
│   │   └── ui/                    # shadcn/ui (New York)
│   ├── hooks/
│   │   ├── use-speech-recognition.ts  # Browser voice input
│   │   └── use-speech-synthesis.ts    # Browser TTS
│   ├── lib/
│   │   ├── ai/                    # groq.ts, gemini.ts, ocr.ts, embeddings.ts, feedback.ts
│   │   ├── grading/               # stemmer.ts, segmenter.ts, evaluator.ts, similarity.ts
│   │   ├── rubric/loader.ts       # Loads /rubrics/*.json files
│   │   ├── db/queries.ts           # Prisma queries
│   │   ├── env.ts                 # Centralised env access
│   │   └── db.ts                  # Prisma client
│   └── types/index.ts             # Shared TS types
├── prisma/schema.prisma           # Submission + Evaluation + RubricMeta
├── rubrics/                       # ★ Rubric JSON files — add/swap freely
│   ├── data-science.json
│   ├── mathematics.json
│   └── general-knowledge.json
├── scripts/                       # UV-managed Python utilities (optional)
│   ├── notebook_pipeline.py       # Mirrors the original Colab notebook
│   └── README.md
├── pyproject.toml                 # UV manifest (Python utilities only)
├── .env.example                   # ★ Copy to .env.local
└── package.json
```

## Configuration

### Environment variables

Copy `.env.example` → `.env.local` and fill in the keys. All keys are
optional but the app degrades gracefully without them:

| Variable | Purpose | Where to get |
| --- | --- | --- |
| `GROQ_API_KEY` | Vision OCR + text + Whisper | https://console.groq.com |
| `GEMINI_API_KEY` | Failsafe for OCR & text | https://aistudio.google.com |
| `HF_TOKEN` | Sentence embeddings (all-MiniLM-L6-v2) | https://huggingface.co/settings/tokens |
| `DATABASE_URL` | SQLite path | Default: `file:/home/z/my-project/db/custom.db` |

Optional model overrides (see `.env.example`):
`GROQ_VISION_MODEL`, `GROQ_TEXT_MODEL`, `GROQ_WHISPER_MODEL`, `GEMINI_MODEL`.

### Customizing the theme

All theme tokens live at the top of `src/app/globals.css` under the
`:root` block. To reskin the entire app:

```css
:root {
  --radius: 1rem;                /* ← change ONE number to reskin radii */
  --brand: oklch(0.71 0.165 227); /* ← sky-500 (change to any color)  */
  --brand-accent: oklch(0.94 0.155 88); /* ← yellow-300 */
  --font-display: var(--font-belleza), "Belleza", serif; /* ← heading font */
}
```

Custom soft shadows are exposed as `.shadow-soft-xs|sm|md|lg|xl|glow` utilities.
Brand gradient utilities: `.brand-gradient-text`, `.brand-gradient-bg`,
`.brand-gradient-bg-soft`, `.brand-gradient-border`.

To swap the heading font: edit `src/app/layout.tsx` (import another
Google font), then update ONE line in `globals.css` (`--font-display`).

### Adding or editing rubrics

Rubrics are JSON files in `/rubrics/<slug>.json`. The shape is:

```json
{
  "slug": "data-science",
  "title": "Data Science — Mock Exam",
  "description": "...",
  "questions": {
    "25": {
      "question": "Name 2 major applications of data science.",
      "model_answer": "...",
      "keywords": ["machine", "learning", "predict", "analysis", "data", "patterns"],
      "max_marks": 5.0
    }
  }
}
```

You can also edit rubrics inline on the **Rubrics** tab and save back to disk.

## Scoring algorithm

Each answer gets two scores, combined per the original Colab notebook:

1. **Semantic similarity** — cosine distance between HuggingFace embeddings
   of the student answer and the model answer (using
   `sentence-transformers/all-MiniLM-L6-v2`).
2. **Keyword match** — for each rubric keyword, Porter-stem it and check
   if the stem appears in the Porter-stemmed student answer.

Final score = `(0.6 × max(0, sem_sim) + 0.4 × kw_score) × max_marks`.

## Python utilities (optional)

A `pyproject.toml` is included so you can run the original Colab pipeline
locally with `uv`. The Next.js app does NOT depend on Python.

```bash
uv sync                                          # install Python deps
export GEMINI_API_KEY=...                        # set in shell, not .env.local
uv run python scripts/notebook_pipeline.py \
    path/to/sheet.jpg --rubric data-science
```

This prints a JSON report identical in shape to the Next.js
`/api/grade` response, so you can parity-test the TS and Python pipelines.

## Deployment

The app builds as a Next.js standalone app (`output: "standalone"` in
`next.config.ts`) so it deploys anywhere Next.js runs.

### Vercel

```bash
vercel
```

Set the same env vars in the Vercel dashboard. For SQLite on Vercel, set
`DATABASE_URL=file:/tmp/custom.db` (Vercel's writable directory) or use
Turso (libSQL) for production persistence.

### Cloudflare Pages (with `@cloudflare/next-on-pages`)

```bash
npx @cloudflare/next-on-pages
wrangler pages deploy .vercel/output/static
```

Use Turso (libSQL) for SQLite on Cloudflare — local SQLite isn't writable
on Workers.

### GitHub Pages

The app requires server-side API routes (vision, chat, DB), so it can't
be deployed as a static GitHub Pages site. Deploy to Vercel/Cloudflare
instead, and use GitHub Pages only for the project's marketing/landing
page if desired.

## Acknowledgements

The original pipeline (OCR → segment → evaluate → feedback) and the
default rubric are adapted from a Colab notebook provided by the user.
The notebook used Gemini 3.6 Flash + sentence-transformers + sklearn
cosine similarity + NLTK Porter stemmer; this app mirrors the same
algorithm in TypeScript and adds a UI, a chatbot, persistence, and a
Groq-first strategy with Gemini failsafe.

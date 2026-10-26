# MEAIFY — Handwritten Answer Grading

> Upload a handwritten answer sheet → AI-assisted OCR → rubric grading → AI feedback → voice-enabled chatbot.

**Meaify** is an AI-assisted exam evaluator for a single teacher. Point it at a photo of a handwritten answer sheet; it runs OCR, scores against a rubric, generates per-question feedback, and keeps a voice-enabled assistant for follow-up questions.

Built with **Next.js 16 · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma + SQLite**.
Primary provider is **Groq**, with **Gemini** as failsafe and **Hugging Face** for embeddings.

## Features

- **Vision OCR** — Groq vision with Gemini fallback.
- **Hybrid rubric scoring** — default `0.6 × semantic + 0.4 × keyword` (Porter stemmer). Override with `SCORE_SEMANTIC_WEIGHT` / `SCORE_KEYWORD_WEIGHT` only after a labeled sweep. Those defaults are not yet fit on human scores.
- **AI feedback** — student text is treated as untrusted data so instructions written on the sheet cannot rewrite the score.
- **Voice chatbot** — Web Speech API, Groq Whisper fallback.
- **Dashboard, command palette** (`⌘K`), rubric browser, history.
- **Audit trail** — OCR provider, latency, and sha256 of the rubric file on every submission.
- **Upload limits** — JPEG/PNG/WebP, 10 MB, files on disk (not data-URLs in SQLite).
- **Health probe** — `GET /api/health` checks that configured Groq model ids still exist.

## Quick start

```bash
bun install
cp .env.example .env.local
# add GROQ_API_KEY and, preferably, GEMINI_API_KEY
bun run db:push
bun run dev          # → http://localhost:3000
```

### Optional Python utilities

The Next.js app does not require Python.

```bash
uv sync
uv run python scripts/notebook_pipeline.py
```

## Deployment

Single-teacher, local. There is no auth layer. Do not put this on the public internet while it stores student photos. For a shared demo, put a secret gate and rate limits in front first.

```bash
docker compose up --build
```

SQLite and uploads persist on the `meaify-data` volume.

Groq retired `llama-3.3-70b-versatile` and Llama 4 Scout from the free tier on 2026-08-16. Defaults are `qwen/qwen3.8-27b` (vision) and `openai/gpt-oss-120b` (text). Confirm them in the [Groq console](https://console.groq.com/docs/models) if `/api/health` lists them as missing.

## Tests

```bash
bun run test
bun run eval:smoke
```

The smoke slice is deterministic and needs no API keys: blank answers, keyword stuffing, score monotonicity, injection redaction, upload caps, and schema checks on `/rubrics`. CI is `.github/workflows/ci.yml`.

A labeled handwritten dataset (synthetic only — never real student work) is still required before the hybrid weights can be published as tuned. That dataset is not in this repo.

## Project structure

```
src/app/api/          ocr, grade, feedback, chat, transcribe, rubric, history, health, uploads
src/lib/grading/      stemmer, segmenter, keywords, weights, evaluator
src/lib/ai/           groq, gemini, ocr, embeddings, feedback
src/lib/rubric/       JSON loader + sha256
prisma/schema.prisma
rubrics/              data-science, mathematics, general-knowledge
scripts/              optional uv Python helpers
```

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `GROQ_API_KEY` | OCR, text, Whisper | — |
| `GEMINI_API_KEY` | Failsafe OCR and text | — |
| `HF_TOKEN` | Embeddings | — |
| `DATABASE_URL` | SQLite | `file:./prisma/dev.db` |
| `GROQ_VISION_MODEL` | Vision OCR | `qwen/qwen3.8-27b` |
| `GROQ_TEXT_MODEL` | Feedback and chat | `openai/gpt-oss-120b` |
| `GROQ_WHISPER_MODEL` | Voice fallback | `whisper-large-v3-turbo` |
| `GEMINI_MODEL` | Failsafe | `gemini-2.5-flash` |
| `UPLOADS_DIR` | Sheet images | `./data/uploads` |

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Dev server on port 3000 |
| `bun run build` / `start` | Standalone production build |
| `bun run db:push` | Push Prisma schema |
| `bun run lint` | ESLint |
| `bun run test` | Vitest |
| `bun run eval:smoke` | Deterministic grading slice |

## License

MIT

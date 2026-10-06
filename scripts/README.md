# Python utilities (optional)

These scripts mirror the original Colab notebook pipeline in pure Python,
so you can:

1. **Parity test** the Next.js app against the notebook output.
2. **Run offline** when Hugging Face inference is rate-limited.
3. **Reuse** the same scoring algorithm in other Python contexts.

## Setup (with `uv`)

```bash
# from the project root
uv sync                                  # install deps (one-time)
export GEMINI_API_KEY=...                # set in your shell, not .env.local
export HF_TOKEN=...                      # optional, for embeddings

uv run python scripts/notebook_pipeline.py path/to/sheet.jpg --rubric data-science
```

## What's here

| File | Purpose |
| ---- | ------- |
| `notebook_pipeline.py` | Full pipeline (OCR → segment → evaluate → feedback). Same JSON shape as `/api/grade`. |
| (add your own) | Drop additional utility scripts here as needed. |

## Why this is optional

The Next.js app is **self-contained in TypeScript** and does not require
Python. Python is included only because the original Colab notebook used
`sentence-transformers`, `sklearn`, and `nltk` — keeping these utilities
lets you reproduce the exact notebook behaviour for parity testing.

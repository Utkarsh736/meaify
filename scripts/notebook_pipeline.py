"""MEAIFY — Notebook pipeline mirror.

This script mirrors the original Colab notebook that powers the
web app's grading pipeline. It runs the SAME pipeline (OCR → segment
→ evaluate → feedback) in pure Python, so you can compare scores
between the Next.js app and the notebook.

Usage:
    uv run python scripts/notebook_pipeline.py path/to/answer_sheet.jpg --rubric data-science

Env (must be set in your shell, NOT .env.local — Python doesn't read that):
    export GEMINI_API_KEY=...
    export HF_TOKEN=...   # only needed for embeddings

The Next.js app reads keys from .env.local; this Python script reads
them from the actual environment, so export them in your shell.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

import nltk
from google import genai
from PIL import Image
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Ensure NLTK data is present (PorterStemmer is built-in, but
# we keep this for parity with the notebook).
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt", quiet=True)

from nltk.stem import PorterStemmer  # noqa: E402


# ---------- 1. CONFIG ----------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash-exp")

if not GEMINI_API_KEY:
    print("⚠️  GEMINI_API_KEY not set in environment. Set it before running.")
    sys.exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)
print("✓ Google GenAI configured.")
print("✓ Loading embedding model all-MiniLM-L6-v2 ...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
stemmer = PorterStemmer()


# ---------- 2. PIPELINE FUNCTIONS ----------
def extract_text_gemini(image_path: str) -> str:
    """OCR with Gemini — same prompt as the web app."""
    image = Image.open(image_path).convert("RGB")
    prompt = (
        "You are an OCR engine. Extract ALL handwritten text from this exam answer sheet "
        "in exact top-to-bottom reading order. Output plain text only. Do not use JSON. "
        "Keep question numbers (e.g., 21, 25, 27, 28, 29, 30) on their own lines."
    )
    response = client.models.generate_content(
        model=GEMINI_MODEL, contents=[prompt, image]
    )
    return response.text.strip()


def group_by_question(raw_text: str, rubric_keys: list[str]) -> dict[str, str]:
    """Same regex segmentation logic as the TS port."""
    q_keys_str = "|".join(re.escape(k) for k in rubric_keys)
    Q_PATTERN = re.compile(
        rf"^(?:Q(?:uestion)?\.?\s*)?({q_keys_str})(?:[\.\):]|\s)", re.IGNORECASE
    )
    grouped: dict[str, str] = {}
    current_q: str | None = None
    for line in raw_text.splitlines():
        line = line.strip()
        if not line:
            continue
        match = Q_PATTERN.match(line)
        if match:
            current_q = match.group(1)
            grouped[current_q] = ""
            remainder = Q_PATTERN.sub("", line, count=1).strip()
            if remainder:
                grouped[current_q] += remainder + " "
        elif current_q:
            grouped[current_q] += line + " "
    return {q: t.strip() for q, t in grouped.items()}


def evaluate_answer(
    student_ans: str, model_ans: str, keywords: list[str], max_marks: float
) -> dict:
    """Hybrid scoring — 0.6 × sem_sim + 0.4 × kw_score."""
    if not student_ans.strip():
        return {"score": 0.0, "missing": keywords, "sem_sim": 0.0}

    emb_s = embedder.encode([student_ans])[0]
    emb_m = embedder.encode([model_ans])[0]
    sem_sim = float(cosine_similarity([emb_s], [emb_m])[0][0])

    student_stems = {stemmer.stem(w.lower()) for w in re.findall(r"\b\w+\b", student_ans)}
    found = [kw for kw in keywords if stemmer.stem(kw.lower()) in student_stems]
    missing = [kw for kw in keywords if kw not in found]
    kw_score = len(found) / len(keywords) if keywords else 1.0

    final_score = round(((0.6 * max(0, sem_sim)) + (0.4 * kw_score)) * max_marks, 2)
    return {"score": min(final_score, max_marks), "missing": missing, "sem_sim": sem_sim}


def generate_feedback(
    question: str, student_ans: str, score: float, max_marks: float, missing: list[str]
) -> str:
    prompt = (
        f"You are an exam evaluator.\n"
        f"Question: {question}\n"
        f"Student Answer: {student_ans}\n"
        f"Score: {score}/{max_marks}\n"
        f"Missing Keywords/Concepts: {', '.join(missing) if missing else 'None'}\n\n"
        f"Write 2 sentences of constructive feedback directly addressing the student in plain text:"
    )
    try:
        response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        return response.text.strip()
    except Exception:
        return (
            f"Your response missed key concepts: {', '.join(missing)}."
            if missing
            else "Good response."
        )


def process_submission(image_path: str, rubric: dict) -> dict:
    """Full pipeline. Returns a dict that matches the Next.js /api/grade response."""
    t0 = time.time()
    raw_ocr = extract_text_gemini(image_path)
    latency_ms = int((time.time() - t0) * 1000)

    rubric_keys = list(rubric["questions"].keys())
    qa_map = group_by_question(raw_ocr, rubric_keys)

    evaluations = []
    total_score = 0.0
    total_max = 0.0
    for q_no, q_data in rubric["questions"].items():
        student_ans = qa_map.get(q_no, "")
        if not student_ans:
            evaluations.append({
                "questionId": q_no,
                "question": q_data["question"],
                "studentAnswer": "",
                "modelAnswer": q_data["model_answer"],
                "keywords": q_data["keywords"],
                "missingKeywords": q_data["keywords"],
                "foundKeywords": [],
                "semanticSimilarity": 0,
                "keywordScore": 0,
                "maxMarks": q_data["max_marks"],
                "suggestedScore": 0,
                "feedback": "Answer not detected in transcript.",
            })
            continue
        ev = evaluate_answer(
            student_ans=student_ans,
            model_ans=q_data["model_answer"],
            keywords=q_data["keywords"],
            max_marks=q_data["max_marks"],
        )
        feedback = generate_feedback(
            question=q_data["question"],
            student_ans=student_ans,
            score=ev["score"],
            max_marks=q_data["max_marks"],
            missing=ev["missing"],
        )
        evaluations.append({
            "questionId": q_no,
            "question": q_data["question"],
            "studentAnswer": student_ans,
            "modelAnswer": q_data["model_answer"],
            "keywords": q_data["keywords"],
            "missingKeywords": ev["missing"],
            "foundKeywords": [k for k in q_data["keywords"] if k not in ev["missing"]],
            "semanticSimilarity": ev["sem_sim"],
            "keywordScore": len(q_data["keywords"] - ev["missing"]) / len(q_data["keywords"]) if q_data["keywords"] else 1,
            "maxMarks": q_data["max_marks"],
            "suggestedScore": ev["score"],
            "feedback": feedback,
        })
        total_score += ev["score"]
        total_max += q_data["max_marks"]

    return {
        "ocr": {"text": raw_ocr, "latencyMs": latency_ms, "provider": "gemini"},
        "segmented": qa_map,
        "evaluations": evaluations,
        "totalScore": round(total_score, 2),
        "totalMax": round(total_max, 2),
    }


def main():
    parser = argparse.ArgumentParser(description="Run the MEAIFY notebook pipeline.")
    parser.add_argument("image", help="Path to the answer sheet image.")
    parser.add_argument(
        "--rubric",
        default="data-science",
        help="Rubric slug (matches /rubrics/<slug>.json).",
    )
    parser.add_argument("--out", default=None, help="Optional output JSON path.")
    args = parser.parse_args()

    image_path = Path(args.image)
    if not image_path.exists():
        print(f"✗ Image not found: {image_path}")
        sys.exit(1)

    rubric_path = Path(__file__).parent.parent / "rubrics" / f"{args.rubric}.json"
    if not rubric_path.exists():
        print(f"✗ Rubric not found: {rubric_path}")
        sys.exit(1)
    rubric = json.loads(rubric_path.read_text())

    report = process_submission(str(image_path), rubric)
    out = json.dumps(report, indent=2)
    print(out)
    if args.out:
        Path(args.out).write_text(out)


if __name__ == "__main__":
    main()

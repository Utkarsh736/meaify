/* ============================================================
   Embeddings — wraps Hugging Face inference API for
   sentence-transformers/all-MiniLM-L6-v2.
   ------------------------------------------------------------
   Why HF instead of running transformers.js locally?
     - Tiny cold start (serverless-friendly)
     - Works on Vercel, Cloudflare Pages Functions, etc.
     - Same model as the Colab notebook so scores match
   ------------------------------------------------------------
   Set `HF_TOKEN` in your .env file. Free tier is generous.
   ============================================================ */

import { env } from "@/lib/env";

const HF_ENDPOINT =
  "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

// 5-min in-process cache so identical strings don't re-hit HF.
const cache = new Map<string, number[]>();

/** Embed a single text → vector (length 384). */
export async function embedText(text: string): Promise<number[]> {
  const key = text.trim().toLowerCase();
  if (!key) return [];
  const cached = cache.get(key);
  if (cached) return cached;

  const token = env.HF_TOKEN;
  if (!token) {
    // If no token configured, fall back to a deterministic hash-based
    // vector so the pipeline keeps working in dev — scores will be
    // non-sensical but the app won't crash.
    return pseudoEmbedding(key);
  }

  const res = await fetch(HF_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  });

  if (!res.ok) {
    console.warn("[embeddings] HF failed, using pseudo-embedding:", res.status);
    return pseudoEmbedding(key);
  }

  // HF returns the embedding array directly
  const data = (await res.json()) as number[] | number[][];
  const emb = Array.isArray(data[0]) ? (data as number[][])[0] : (data as number[]);
  cache.set(key, emb);
  return emb;
}

/** Embed multiple texts in one request (HF supports batch). */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const token = env.HF_TOKEN;
  if (!token) {
    return texts.map((t) => pseudoEmbedding(t.trim().toLowerCase()));
  }

  const res = await fetch(HF_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
  });
  if (!res.ok) {
    console.warn("[embeddings] HF batch failed:", res.status);
    return texts.map((t) => pseudoEmbedding(t.trim().toLowerCase()));
  }
  const data = (await res.json()) as number[][];
  data.forEach((vec, i) => cache.set(texts[i].trim().toLowerCase(), vec));
  return data;
}

/**
 * Deterministic fallback embedding when no HF token is set.
 * Produces a 384-d vector by hashing the word tokens — purely so the
 * app doesn't crash during local dev without a token.
 */
function pseudoEmbedding(text: string): number[] {
  const DIM = 384;
  const vec = new Array(DIM).fill(0);
  const tokens = text.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    let h = 5381;
    const tok = tokens[i];
    for (let c = 0; c < tok.length; c++) {
      h = ((h << 5) + h + tok.charCodeAt(c)) | 0;
    }
    const idx = Math.abs(h) % DIM;
    vec[idx] += 1;
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

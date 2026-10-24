/* POST /api/transcribe
 * Body: { audioBase64: string, mimeType?: string }
 * Returns: { text: string }
 *
 * Transcribes a short voice clip via Groq Whisper. Used by the
 * chatbot voice-input button (browser-side SpeechRecognition is
 * also supported, but Groq Whisper gives a server-side fallback
 * for browsers that lack Web Speech API support).
 */
import { NextResponse } from "next/server";
import { groqTranscribe } from "@/lib/ai/groq";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not set — transcription unavailable." },
      { status: 503 }
    );
  }
  const body = (await req.json()) as {
    audioBase64?: string;
    mimeType?: string;
  };
  if (!body.audioBase64) {
    return NextResponse.json(
      { error: "audioBase64 is required" },
      { status: 400 }
    );
  }
  try {
    const text = await groqTranscribe(
      body.audioBase64,
      body.mimeType ?? "audio/webm"
    );
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

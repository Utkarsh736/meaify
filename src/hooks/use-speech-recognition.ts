"use client";

/* ============================================================
   useSpeechRecognition — wraps the Web Speech API for voice input.
   ------------------------------------------------------------
   Browser support: Chrome, Edge, Safari (webkitSpeechRecognition).
   Firefox: not supported — fall back to /api/transcribe (Groq Whisper).
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOpts {
  /** Called when recognition finalises a phrase. */
  onFinal?: (text: string) => void;
  /** Called continuously as interim results stream in. */
  onInterim?: (text: string) => void;
  /** Default recognition language (BCP-47). */
  lang?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type Ctor = new () => SpeechRecognitionLike;

function getCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: Ctor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: Ctor }).webkitSpeechRecognition ??
    null
  );
}

// Lazy initialiser runs once on the client (returns false during SSR).
function useSupported() {
  const [supported] = useState<boolean>(() => {
    if (typeof window === "undefined") return true; // assume supported during SSR
    return getCtor() !== null;
  });
  return supported;
}

export function useSpeechRecognition(opts: UseSpeechRecognitionOpts = {}) {
  const { onFinal, onInterim, lang = "en-US" } = opts;
  const supported = useSupported();
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef(onFinal);
  const interimRef = useRef(onInterim);

  // Keep callbacks fresh without re-creating recognition
  useEffect(() => {
    finalRef.current = onFinal;
    interimRef.current = onInterim;
  }, [onFinal, onInterim]);

  useEffect(() => {
    if (!supported) return;
    const Ctor = getCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0].transcript;
        if (i === e.results.length - 1) finalText = t;
        else interimText += t;
      }
      setInterim(interimText || finalText);
      interimRef.current?.(interimText || finalText);
      if (finalText) {
        finalRef.current?.(finalText.trim());
        setInterim("");
      }
    };
    rec.onerror = (e) => {
      setError(e.error);
      setIsListening(false);
    };
    rec.onend = () => {
      setIsListening(false);
      setInterim("");
    };
    recRef.current = rec;
    return () => {
      rec.abort();
      recRef.current = null;
    };
  }, [lang, supported]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    setError(null);
    try {
      recRef.current.start();
      setIsListening(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, interim, error, supported, start, stop };
}

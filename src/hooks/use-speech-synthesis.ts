"use client";

/* ============================================================
   useSpeechSynthesis — wraps the Web Speech API for voice output.
   ------------------------------------------------------------
   Browser support: All modern browsers (Chromium, WebKit, Gecko).
   No network call needed — uses the OS-bundled TTS engine.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechSynthesisOpts {
  enabled?: boolean;
  voiceURI?: string;
  rate?: number;
  pitch?: number;
}

export function useSpeechSynthesis(opts: SpeechSynthesisOpts = {}) {
  const { enabled = true, voiceURI, rate = 1, pitch = 1 } = opts;
  const optsRef = useRef({ enabled, voiceURI, rate, pitch });
  useEffect(() => {
    optsRef.current = { enabled, voiceURI, rate, pitch };
  }, [enabled, voiceURI, rate, pitch]);

  // Lazy initialiser — runs once on the client.
  const [supported] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return "speechSynthesis" in window;
  });

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener("voiceschanged", load);
    return () => synth.removeEventListener("voiceschanged", load);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      const o = optsRef.current;
      if (!o.enabled || !supported || !text) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = o.rate;
      u.pitch = o.pitch;
      if (o.voiceURI) {
        const v = voices.find((vo) => vo.voiceURI === o.voiceURI);
        if (v) u.voice = v;
      }
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      synth.speak(u);
    },
    [supported, voices]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { voices, speaking, supported, speak, stop };
}

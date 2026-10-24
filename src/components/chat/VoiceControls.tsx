"use client";

/* ============================================================
   VoiceControls — microphone button + TTS toggle.
   ------------------------------------------------------------
   Voice input uses Web Speech API when available; falls back
   to /api/transcribe (Groq Whisper) when the browser doesn't
   support SpeechRecognition.
   Voice output uses SpeechSynthesis (browser-native TTS).
   ============================================================ */

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Loader2, Volume2, VolumeX, AlertCircle } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MediaRecorderLike extends MediaRecorder {
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
}

export function VoiceControls({
  onUserMessage,
  assistantText,
  rubricSlug,
}: {
  onUserMessage: (text: string) => void;
  assistantText: string;
  rubricSlug?: string;
}) {
  const [ttsOn, setTtsOn] = useState(true);
  const [whispering, setWhispering] = useState(false);
  const mediaRef = useRef<MediaRecorderLike | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Voice output (TTS)
  const synth = useSpeechSynthesis({ enabled: ttsOn, rate: 1 });

  function speak(text: string) {
    if (ttsOn) synth.speak(text);
  }

  // Voice input (browser-native)
  const speech = useSpeechRecognition({
    onFinal: (text) => onUserMessage(text),
  });

  async function startWhisperFallback() {
    if (!navigator.mediaDevices) {
      toast.error("Microphone not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream) as MediaRecorderLike;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        // Down-mix to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const b64 = dataUrl.split(",")[1];
          setWhispering(true);
          try {
            const r = await fetch("/api/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioBase64: b64, mimeType: "audio/webm" }),
            });
            const data = await r.json();
            if (data.text) onUserMessage(data.text);
            else toast.error(data.error ?? "Transcription failed");
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setWhispering(false);
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      mediaRef.current = rec;
      // Auto-stop after 8s
      setTimeout(() => {
        if (rec.state !== "inactive") rec.stop();
      }, 8000);
    } catch (e) {
      toast.error("Microphone permission denied");
    }
  }

  function toggleMic() {
    if (speech.supported) {
      if (speech.isListening) speech.stop();
      else speech.start();
      return;
    }
    // Fallback: Groq Whisper
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    } else {
      startWhisperFallback();
    }
  }

  const isRecording = speech.isListening || whispering;

  return (
    <div className="flex items-center gap-2 px-2 py-2 border-t border-border/60 bg-muted/30">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={toggleMic}
        className={cn(
          "h-9 w-9 shrink-0 transition-all relative",
          isRecording
            ? "bg-destructive text-destructive-foreground shadow-soft-sm"
            : "hover:bg-brand/10 hover:text-brand"
        )}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {whispering ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={16} />
        ) : (
          <Mic size={16} />
        )}
        {isRecording && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive animate-ping" />
        )}
      </Button>

      <div className="flex-1 text-xs text-muted-foreground min-w-0 truncate">
        {speech.isListening
          ? "Listening…"
          : whispering
          ? "Transcribing via Whisper…"
          : speech.supported
          ? "Tap mic to ask a question"
          : "Mic input via Groq Whisper"}
      </div>

      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        {ttsOn ? (
          <Volume2 size={14} className="text-brand" />
        ) : (
          <VolumeX size={14} className="text-muted-foreground" />
        )}
        <Switch
          checked={ttsOn}
          onCheckedChange={(v) => {
            setTtsOn(v);
            if (!v) synth.stop();
            else if (assistantText) synth.speak(assistantText);
          }}
          aria-label="Toggle voice output"
        />
      </label>

      {!speech.supported && (
        <span className="pill bg-amber-100 text-amber-800" title="Web Speech API not supported">
          <AlertCircle size={10} /> fallback
        </span>
      )}
    </div>
  );
}

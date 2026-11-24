"use client";

import { useRef, useState } from "react";

/* Optional voice note capture (ADR-0020) for the service booking form —
   browser MediaRecorder, no server round-trip until final submit (the
   recorded Blob is handed to the parent form and uploaded alongside the
   photos). Entirely optional: a customer can submit with photos only. */

export function VoiceRecorder({ onChange }: { onChange: (blob: Blob | null) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "recorded">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const start = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Voice recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported?.(t));
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setUrl(URL.createObjectURL(blob));
        onChange(blob);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      rec.start();
      mediaRef.current = rec;
      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access was denied — allow it in your browser to record a voice note.");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setState("recorded");
  };

  const clear = () => {
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setState("idle");
    onChange(null);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div>
      {state === "idle" && (
        <button
          type="button"
          onClick={() => void start()}
          className="inline-flex h-10 items-center gap-2 rounded-[2px] border border-n400 bg-chalk px-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
            <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
          </svg>
          Record a voice note
        </button>
      )}
      {state === "recording" && (
        <button
          type="button"
          onClick={stop}
          className="inline-flex h-10 items-center gap-2 rounded-[2px] bg-bad px-3.5 text-sm font-semibold text-white"
        >
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
          Stop recording · <span className="num">{mm}:{ss}</span>
        </button>
      )}
      {state === "recorded" && url && (
        <div className="flex flex-wrap items-center gap-3">
          <audio controls src={url} className="h-9" />
          <button type="button" onClick={clear} className="text-[13px] font-medium text-n600 underline-offset-2 hover:text-ink hover:underline">
            Remove
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-bad">{error}</p>}
      <p className="mt-1.5 text-xs text-n600">
        Optional — describe what&apos;s wrong in your own words instead of typing it.
      </p>
    </div>
  );
}

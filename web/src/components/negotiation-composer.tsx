"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/* Negotiation thread composer (SUP-008, integration point I4):
   sends a REAL message into the private thread with Smash Pro.
   Messages are immutable once sent. */

export function NegotiationComposer({ reqId }: { reqId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/supplier/quotes/${reqId}/message`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      if (res.ok) {
        setText("");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "The message didn't send — please try again.");
      }
    } catch {
      setError("The message didn't send — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
    {error && (
      <p role="alert" className="mt-3 border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink">{error}</p>
    )}
    <div className="mt-4 flex gap-2.5">
      <input
        type="text"
        placeholder="Write a message to Smash Pro"
        aria-label="Message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
        className="h-10 flex-1 rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink placeholder:text-n400"
      />
      <button
        onClick={() => void send()}
        disabled={!text.trim() || busy}
        className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400"
      >
        {busy ? "Sending…" : "Send"}
      </button>
    </div>
    </>
  );
}

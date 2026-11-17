"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";

/* ============================================================
   Shared admin mutation hook — the negotiation-composer pattern
   generalised: busy state, server error surfaced verbatim,
   success toast + router.refresh(). Every admin mutation control
   goes through this so feedback behaviour is identical
   everywhere.
   ============================================================ */

export function useAdminCall() {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fires the mutation; returns true on success (after refresh+toast). */
  const call = async (
    url: string,
    opts: { method?: "POST" | "PATCH" | "DELETE"; body?: unknown; done?: string } = {},
  ): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: opts.method ?? "POST",
        headers: opts.body !== undefined ? { "content-type": "application/json" } : undefined,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "The action could not be completed — please try again.");
        return false;
      }
      if (opts.done) toast(opts.done);
      router.refresh();
      return true;
    } catch {
      setError("The action could not be completed — check your connection and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, setError, call };
}

/** Inline failure alert — reads the server's error message. */
export function ActionError({ error, className = "mt-2.5" }: { error: string | null; className?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className={`border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink ${className}`}>
      {error}
    </p>
  );
}

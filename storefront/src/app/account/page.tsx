"use client";

import { useState } from "react";
import Link from "next/link";
import { useIsClient, useRole } from "@/components/providers";

/* Account — sign-in form (mock, no real auth) for visitors; a simple
   profile shell for the demo "signed-in" state. ADR-0008: labelled
   fixture, not a real authentication flow. */

export default function AccountPage() {
  const { role, setRole } = useRole();
  const mounted = useIsClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!mounted) return <main className="mx-auto max-w-[560px] px-4 py-14 md:px-10" />;

  if (role === "signed-in") {
    return (
      <main className="mx-auto max-w-[720px] px-4 py-14 md:px-10">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Your account</h1>
        <p className="mt-2 text-[14px] text-n600">Demo Institution · Buyer account (fixture)</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Link href="/account/orders" className="block rounded-[2px] border border-n200 bg-chalk p-5 transition-colors hover:border-n400">
            <div className="font-display text-[15px] font-bold text-ink">Orders</div>
            <div className="mt-1 text-[13px] text-n600">Track status and documents</div>
          </Link>
          <Link href="/wishlist" className="block rounded-[2px] border border-n200 bg-chalk p-5 transition-colors hover:border-n400">
            <div className="font-display text-[15px] font-bold text-ink">Wishlist</div>
            <div className="mt-1 text-[13px] text-n600">Products saved for later</div>
          </Link>
        </div>
        <button onClick={() => setRole("visitor")} className="mt-8 text-[13px] font-medium text-n600 underline-offset-2 hover:text-ink hover:underline">
          Sign out
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[460px] px-4 py-14 md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Sign in</h1>
      <p className="mt-2 text-[14px] text-n600">Preview only — this signs you into the demo state, not a real account.</p>
      <form
        className="mt-7 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!email.includes("@")) { setError("Enter a valid email address."); return; }
          if (password.length < 4) { setError("Password must be at least 4 characters."); return; }
          setBusy(true);
          setTimeout(() => { setBusy(false); setRole("signed-in"); }, 500);
        }}
      >
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm focus:border-ink focus:outline-none" placeholder="you@institution.edu" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink">Password</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm focus:border-ink focus:outline-none" />
        </div>
        {error && <p className="text-[13px] font-medium text-bad">{error}</p>}
        <button disabled={busy} className="flex h-12 w-full items-center justify-center rounded-[2px] bg-ember-deep text-sm font-semibold text-white transition-colors hover:bg-ember-press disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-5 text-[13px] text-n600">New institution? <Link href="/register" className="font-semibold text-ember-deep hover:underline">Register here</Link></p>
    </main>
  );
}

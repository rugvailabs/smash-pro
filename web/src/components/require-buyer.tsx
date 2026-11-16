"use client";

import Link from "next/link";
import { useRole } from "@/components/providers";

/* ============================================================
   Role gate for the buyer workspace (PLT-001 role-scoped access).
   Client-side gating is PRESENTATION ONLY in this preview — with
   real authentication the same boundary is enforced server-side
   via middleware/route guards, and buyer data is never served to
   other roles at all.
   ============================================================ */

export function RequireBuyer({ children }: { children: React.ReactNode }) {
  const { role, setRole, ready } = useRole();

  if (!ready) return <main className="min-h-[50vh]" />;

  if (role === "buyer") return <>{children}</>;

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-10 md:px-10">
      <div className="mx-auto max-w-[620px] rounded-[2px] border border-n200 bg-chalk p-8">
        <div className="font-mono text-[11px] uppercase tracking-[.08em] text-ember-deep">
          Approved buyer area
        </div>
        <h1 className="mb-2 mt-2 font-display text-2xl font-bold tracking-tight text-ink">
          This workspace is for approved buyer accounts
        </h1>
        {role === "pending" ? (
          <p className="mb-5 text-sm text-n600">
            Your registration is under review. The buyer workspace — orders,
            payments, requests and your institution profile — unlocks when your
            account is approved.
          </p>
        ) : role === "supplier" ? (
          <p className="mb-5 text-sm text-n600">
            You&rsquo;re previewing as a supplier. Buyer orders, payments and
            institutional data are never visible to supplier accounts — this
            boundary is enforced for every role.
          </p>
        ) : (
          <p className="mb-5 text-sm text-n600">
            Sign in with an approved institutional account to see your orders,
            payments, requests and profile.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setRole("buyer")}
            className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press"
          >
            Preview as approved buyer
          </button>
          <Link
            href="/catalog?cat=cricket"
            className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk px-5 text-sm font-semibold text-ink hover:border-ink"
          >
            Browse the catalogue
          </Link>
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-n400">
          preview gate — production enforces this server-side (plt-001)
        </p>
      </div>
    </main>
  );
}

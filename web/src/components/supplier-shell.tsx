"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useRole } from "@/components/providers";

/* ============================================================
   Supplier workspace shell: role gate + side navigation.
   PLT-001 role-scoped access — client gating is presentation
   only; production enforces this server-side. The workspace is
   operational (work-focused), per the approved supplier previews.
   ============================================================ */

function SupplierGate() {
  const { role, setRole } = useRole();

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-10 md:px-10">
      <div className="mx-auto max-w-[620px] rounded-[2px] border border-n200 bg-chalk p-8">
        <div className="font-mono text-[11px] uppercase tracking-[.08em] text-ember-deep">
          Supplier workspace
        </div>
        <h1 className="mb-2 mt-2 font-display text-2xl font-bold tracking-tight text-ink">
          This workspace is for approved supplier accounts
        </h1>
        {role === "buyer" ? (
          <p className="mb-5 text-sm text-n600">
            You&rsquo;re previewing as a buyer. Supplier requirements,
            quotations, purchase orders and payment records are never visible
            to buyer accounts — this boundary is enforced for every role.
          </p>
        ) : role === "pending" ? (
          <p className="mb-5 text-sm text-n600">
            Your registration is under review. Supplier workspaces unlock only
            for approved supplier accounts.
          </p>
        ) : (
          <p className="mb-5 text-sm text-n600">
            Sign in with an approved supplier account to see your matched
            requirements, quotations, purchase orders and payments.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setRole("supplier")}
            className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press"
          >
            Preview as supplier
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk px-5 text-sm font-semibold text-ink hover:border-ink"
          >
            Back to the site
          </Link>
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-n400">
          preview gate — production enforces this server-side (plt-001)
        </p>
      </div>
    </main>
  );
}

const NAV: { group: string; items: { href: string; label: string; count?: number }[] }[] = [
  {
    group: "Work",
    items: [
      { href: "/supplier", label: "Dashboard" },
      { href: "/supplier/requirements", label: "Requirements", count: 2 },
      { href: "/supplier/quotes", label: "Quotations", count: 1 },
      { href: "/supplier/pos", label: "Purchase orders", count: 2 },
    ],
  },
  { group: "Money", items: [{ href: "/supplier/payments", label: "Payments" }] },
  { group: "Catalogue", items: [{ href: "/supplier/catalog", label: "My catalogue" }] },
  { group: "Account", items: [{ href: "/supplier/profile", label: "Profile" }] },
];

export function SupplierNav() {
  const pathname = usePathname();
  const isOn = (href: string) =>
    href === "/supplier" ? pathname === "/supplier" : pathname.startsWith(href);

  return (
    <nav aria-label="Supplier workspace" className="shrink-0 lg:w-[200px]">
      {/* mobile: horizontal strip · desktop: side rail */}
      <div className="flex gap-1 overflow-x-auto border-b border-n200 bg-chalk px-1 lg:block lg:border-b-0 lg:bg-transparent lg:px-0">
        {NAV.map((g) => (
          <div key={g.group} className="flex gap-1 lg:block">
            <div className="hidden pb-1.5 pt-4 font-mono text-[10px] uppercase tracking-[.08em] text-n400 first:pt-0 lg:block">
              {g.group}
            </div>
            {g.items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={
                  "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[2px] px-3 py-2.5 text-sm font-medium lg:w-full " +
                  (isOn(i.href)
                    ? "bg-chalk text-ink shadow-[inset_2px_0_0_var(--color-ember)] lg:border lg:border-n200"
                    : "text-n800 hover:text-ink")
                }
              >
                {i.label}
                {i.count !== undefined && (
                  <span className="num ml-auto rounded-[2px] bg-n100 px-1.5 font-mono text-[10px] text-n600">
                    {i.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}

export function SupplierShell({ children }: { children: React.ReactNode }) {
  const { role, ready } = useRole();
  const allowed = ready && role === "supplier";

  // The workspace subtree always renders (so route segments stay valid) but
  // is hidden behind the gate for other roles — presentation only; the
  // production server never serves supplier data to other roles (PLT-001).
  return (
    <>
      {ready && !allowed && <SupplierGate />}
      {!ready && <main className="min-h-[50vh]" />}
      <div hidden={!allowed}>
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pb-16 pt-5 md:px-10 lg:flex-row lg:gap-8">
          {/* usePathname (active item) needs a Suspense boundary to prerender */}
          <Suspense fallback={<nav className="shrink-0 lg:w-[200px]" />}>
            <SupplierNav />
          </Suspense>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </>
  );
}

export function Dest({ direct }: { direct: boolean }) {
  return (
    <span
      className={
        "inline-flex h-6 items-center whitespace-nowrap rounded-[2px] border px-2 font-mono text-[10px] uppercase tracking-wide " +
        (direct ? "border-ember-deep text-ember-deep" : "border-n400 text-n600")
      }
    >
      {direct ? "Direct" : "Warehouse"}
    </span>
  );
}

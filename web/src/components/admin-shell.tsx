"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

/* ============================================================
   Super Admin operations shell (B5): left rail navigation in the
   supplier-shell idiom — 232px rail, 3px ember active bar, mono
   group labels; mobile falls back to horizontal scroll tabs.
   Access is gated SERVER-SIDE per page (getAdminCounts() returns
   null for non-admin sessions → AdminGate). The shell itself
   renders no data.
   ============================================================ */

const NAV: { group: string; items: { href: string; label: string }[] }[] = [
  {
    group: "Work",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/approvals", label: "Approvals" },
      { href: "/admin/sourcing", label: "Sourcing" },
      { href: "/admin/pos", label: "Purchase orders" },
    ],
  },
  {
    group: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/complaints", label: "Complaints" },
    ],
  },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/catalog", label: "Products" },
      { href: "/admin/pricing", label: "Pricing" },
      { href: "/admin/requests", label: "Buyer requests" },
    ],
  },
  { group: "Insight", items: [{ href: "/admin/reports", label: "Reports" }] },
];

function AdminNav() {
  const pathname = usePathname();
  const isOn = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav aria-label="Operations console" className="shrink-0 lg:w-[232px]">
      <div className="hidden pb-1 font-mono text-[10px] uppercase tracking-[.08em] text-ember-deep lg:block">
        ProSmash · Operations
      </div>
      {/* mobile: horizontal strip · desktop: side rail */}
      <div className="flex gap-1 overflow-x-auto border-b border-n200 bg-chalk px-1 lg:block lg:border-b-0 lg:bg-transparent lg:px-0">
        {NAV.map((g) => (
          <div key={g.group} className="flex gap-1 lg:block">
            <div className="hidden pb-1.5 pt-4 font-mono text-[10px] uppercase tracking-[.08em] text-n400 lg:block">
              {g.group}
            </div>
            {g.items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={
                  "flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-[2px] px-3 py-2 text-sm font-medium lg:w-full " +
                  (isOn(i.href)
                    ? "bg-chalk text-ink shadow-[inset_3px_0_0_var(--color-ember)] lg:border lg:border-n200"
                    : "text-n800 hover:text-ink")
                }
              >
                {i.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 pb-16 pt-5 md:px-8 lg:flex-row lg:gap-8">
      {/* usePathname (active item) needs a Suspense boundary to prerender */}
      <Suspense fallback={<nav className="shrink-0 lg:w-[232px]" />}>
        <AdminNav />
      </Suspense>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Rendered by every admin page when the server says the session is not an
 *  operations account (getAdminCounts() → null). No operational data is ever
 *  serialised for such sessions — this panel is all they get. */
export function AdminGate() {
  return (
    <main>
      <div className="mx-auto max-w-[620px] rounded-[2px] border border-n200 bg-chalk p-8">
        <div className="font-mono text-[11px] uppercase tracking-[.08em] text-ember-deep">
          Operations console
        </div>
        <h1 className="mb-2 mt-2 font-display text-2xl font-bold tracking-tight text-ink">
          This console is for the ProSmash operations team
        </h1>
        <p className="mb-5 text-sm text-n600">
          Supplier approvals, sourcing, order and payment verification run
          here. Access is limited to ProSmash Super Admin accounts — buyer and
          supplier workspaces have their own sign-ins.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/signin"
            className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk px-5 text-sm font-semibold text-ink hover:border-ink"
          >
            Back to the site
          </Link>
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-n400">
          access enforced server-side — non-admin sessions receive no
          operational data (plt-001)
        </p>
      </div>
    </main>
  );
}

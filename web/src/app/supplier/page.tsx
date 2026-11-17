import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Banner, Chip, KV, NoteFlag, PageHead, Panel, PanelHead } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { Dest } from "@/components/supplier-shell";
import { getPOs, getSupplierProfile } from "@/lib/supplier-api";
import { inr } from "@/lib/format";

/* Supplier dashboard — action queue, POs, account summary.
   Boundary: no buyer identities, no competing quotations, no requirement
   origins. Data illustrative. */

export const metadata: Metadata = { title: "Supplier Workspace" };

export default function SupplierDashboard() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <SupplierDashboardContent />
    </Suspense>
  );
}

async function SupplierDashboardContent() {
  const [profile, pos] = await Promise.all([getSupplierProfile(), getPOs()]);
  const active = pos.filter((p) => p.fulfilment === "acknowledged" || p.fulfilment === "awaiting-proof");

  return (
    <main>
      <PageHead
        title="What needs you now"
        sub={<>{profile.name} · 14 Nov 2026
          <NoteFlag className="mt-1">illustrative preview data — figures &amp; amounts are sample values</NoteFlag></>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { href: "/supplier/requirements", l: "Open matched requirements", v: "2", c: "1 closes today", warn: true },
          { href: "/supplier/quotes/REQ-2026-0089", l: "Quotes needing action", v: "1", c: "Revision requested", warn: true },
          { href: "/supplier/pos", l: "POs in fulfilment", v: "2", c: "1 awaiting delivery proof", warn: true },
          { href: "/supplier/payments", l: "Outstanding receivable", v: inr(995000), c: "across 1 PO", warn: false, num: true },
        ].map((t) => (
          <Link key={t.l} href={t.href} className="rounded-[2px] border border-n200 bg-chalk p-4 transition-colors hover:border-n400">
            <div className="font-mono text-[10px] uppercase tracking-[.07em] text-n600">{t.l}</div>
            <div className={`num mt-1 font-display font-bold text-ink ${t.num ? "text-[19px]" : "text-[27px]"}`}>{t.v}</div>
            <div className={`mt-0.5 text-xs ${t.warn ? "font-medium text-warn" : "text-n600"}`}>{t.c}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[7fr_5fr]">
        <div className="space-y-5">
          <Panel>
            <PanelHead title="Action queue" aside={<span className="font-mono text-[11px] text-n600">3 items</span>} />
            <div className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">
                  Upload delivery proof — <span className="font-mono text-[12.5px]">PO-2026-00425</span>
                </div>
                <div className="text-[13px] text-n600">Direct shipment dispatched 13 Nov · proof required before buyer confirmation</div>
              </div>
              <Chip tone="warn">Awaiting proof</Chip>
              <Link href="/supplier/pos/PO-2026-00425/proof" className="inline-flex h-9 items-center rounded-[2px] bg-ember-deep px-3.5 text-[13px] font-semibold text-white hover:bg-ember-press">Upload</Link>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">
                  Revision requested — <span className="font-mono text-[12.5px]">REQ-2026-0089</span> quotation
                </div>
                <div className="text-[13px] text-n600">ProSmash asked for a revised lead time · requested 13 Nov</div>
              </div>
              <Chip tone="warn">Revision requested</Chip>
              <Link href="/supplier/quotes/REQ-2026-0089" className="inline-flex h-9 items-center rounded-[2px] border border-n400 bg-chalk px-3.5 text-[13px] font-semibold text-ink hover:border-ink">Open</Link>
            </div>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">
                  Requirement closes today — <span className="font-mono text-[12.5px]">REQ-2026-0091</span>
                </div>
                <div className="text-[13px] text-n600">Adjustable training hurdles × 120 · quote by 18:00 IST</div>
              </div>
              <Chip tone="info">Open</Chip>
              <Link href="/supplier/requirements/REQ-2026-0091" className="inline-flex h-9 items-center rounded-[2px] border border-n400 bg-chalk px-3.5 text-[13px] font-semibold text-ink hover:border-ink">Review</Link>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Purchase orders" aside={<Link className="text-[13px] font-semibold text-ember-deep hover:underline" href="/supplier/pos">All →</Link>} />
            {active.map((p) => (
              <Link key={p.id} href={`/supplier/pos/${p.id}`} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3 last:border-b-0 hover:bg-paper">
                <span className="font-mono text-[12.5px] text-ink">{p.id}</span>
                <Dest direct={p.destination === "direct"} />
                <span className="min-w-0 flex-1 text-[13px] text-n600">
                  {p.lineQty} × {p.lineName.split(" — ")[0]}{p.dispatchBy ? ` · dispatch by ${p.dispatchBy}` : p.shipment ? ` · dispatched ${p.shipment.dispatched.split(" 2026")[0]}` : ""}
                </span>
                <Chip tone={p.fulfilment === "awaiting-proof" ? "warn" : "info"}>{p.fulfilmentLabel}</Chip>
              </Link>
            ))}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHead title="Your account" />
            <div className="px-5 py-4">
              <KV k="Status"><Chip tone="ok">Active</Chip></KV>
              <KV k="Categories">{profile.categories.join(" · ")}</KV>
              <KV k="Direct shipment"><Chip tone="ok">Approved</Chip></KV>
            </div>
          </Panel>
          <NoteFlag>
            direct-shipment eligibility is set by prosmash per supplier and per
            product — view-only here (obd-19)
          </NoteFlag>
          <Banner tone="info">
            <b className="text-ink">Requirements are matched to your approved
            categories.</b> You&rsquo;ll be notified when a new requirement is
            published in Cricket, Athletics or Gym &amp; Fitness.
          </Banner>
        </div>
      </div>
    </main>
  );
}

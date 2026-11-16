import Link from "next/link";
import type { Metadata } from "next";
import { RequireBuyer } from "@/components/require-buyer";
import { Banner, Chip, KV, NoteFlag, PageHead, Panel, PanelHead, type ChipTone } from "@/components/buyer-ui";
import { getInstitution, getOrders, getRequests } from "@/lib/buyer-api";
import { inr } from "@/lib/format";
import type { Order } from "@/lib/types";

/* Buyer dashboard — action items, recent orders, account summary. */

export const metadata: Metadata = { title: "Dashboard" };

const STATUS_TONE: Record<string, ChipTone> = {
  placed: "info", processing: "info", dispatched: "info",
  delivered: "ok", "confirm-receipt": "warn", cancelled: "bad",
};
const PAY_TONE: Record<string, ChipTone> = {
  confirmed: "ok", "awaiting-verification": "warn", failed: "bad", "cancelled-unpaid": "bad",
};

function OrderRow({ o }: { o: Order }) {
  return (
    <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3 last:border-b-0 hover:bg-paper">
      <span className="font-mono text-[12.5px] text-ink">{o.id}</span>
      <span className="min-w-0 flex-1 text-[13px] text-n600">
        {o.placed} · {o.lines.length} {o.lines.length === 1 ? "line" : "lines"}{o.direct ? " · direct shipment" : ""}
      </span>
      <Chip tone={o.status === "placed" ? PAY_TONE[o.payment.status] : STATUS_TONE[o.status]}>
        {o.status === "placed" ? o.payment.statusLabel : o.statusLabel}
      </Chip>
      <span className="num text-sm font-semibold text-ink">{inr(o.total)}</span>
    </Link>
  );
}

export default async function DashboardPage() {
  const [orders, requests, inst] = await Promise.all([getOrders(), getRequests(), getInstitution()]);
  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const confirmPending = orders.find((o) => o.status === "confirm-receipt");
  const payPending = orders.find((o) => o.payment.status === "awaiting-verification");
  const openRequest = requests.find((r) => r.status === "in-review");

  return (
    <RequireBuyer>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10">
        <PageHead
          title={<>Good morning, St.&nbsp;Xavier&rsquo;s</>}
          sub={<>Here&rsquo;s where your procurement stands today.
            <NoteFlag className="mt-1">illustrative preview data — metrics &amp; amounts are sample values</NoteFlag></>}
          actions={<Link href="/catalog?cat=cricket" className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press">Browse catalogue</Link>}
        />

        {/* tiles */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { href: "/orders", l: "Active orders", v: String(active.length), c: "2 in fulfilment", warn: false },
            { href: payPending ? `/payments` : "/payments", l: "Payment actions", v: payPending ? "1" : "0", c: "NEFT proof awaiting verification", warn: true },
            { href: confirmPending ? `/orders/${confirmPending.id}` : "/orders", l: "Delivery confirmations", v: confirmPending ? "1" : "0", c: "Direct shipment delivered — confirm receipt", warn: true },
            { href: "/requests", l: "Product requests", v: "1", c: "In sourcing review", warn: false },
          ].map((t) => (
            <Link key={t.l} href={t.href} className="rounded-[2px] border border-n200 bg-chalk p-4 transition-colors hover:border-n400">
              <div className="font-mono text-[10px] uppercase tracking-[.07em] text-n600">{t.l}</div>
              <div className="num mt-1 font-display text-[27px] font-bold text-ink">{t.v}</div>
              <div className={`mt-0.5 text-xs ${t.warn ? "font-medium text-warn" : "text-n600"}`}>{t.c}</div>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[7fr_5fr]">
          <div className="space-y-5">
            <Panel>
              <PanelHead title="Needs your action" aside={<span className="font-mono text-[11px] text-n600">2 items</span>} />
              {confirmPending && (
                <div className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">
                      Confirm delivery receipt — <span className="font-mono text-[12.5px]">{confirmPending.id}</span>
                    </div>
                    <div className="text-[13px] text-n600">Direct shipment · delivery proof uploaded 13 Nov 2026</div>
                  </div>
                  <Chip tone="warn">Awaiting your confirmation</Chip>
                  <Link href={`/orders/${confirmPending.id}`} className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press">
                    Review &amp; confirm
                  </Link>
                </div>
              )}
              {payPending && (
                <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">
                      Payment under verification — <span className="font-mono text-[12.5px]">{payPending.id}</span>
                    </div>
                    <div className="num text-[13px] text-n600">NEFT proof uploaded 14 Nov 2026 · {inr(payPending.total)}</div>
                  </div>
                  <Chip tone="warn">Awaiting verification</Chip>
                  <Link href={`/payments`} className="inline-flex h-10 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink">
                    View payment
                  </Link>
                </div>
              )}
            </Panel>

            <Panel>
              <PanelHead title="Recent orders" aside={<Link className="text-[13px] font-semibold text-ember-deep hover:underline" href="/orders">All orders →</Link>} />
              {orders.slice(0, 3).map((o) => <OrderRow key={o.id} o={o} />)}
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel>
              <PanelHead title="Your account" />
              <div className="px-5 py-4">
                <KV k="Status"><Chip tone="ok">Active</Chip></KV>
                <KV k="Buyer category">{inst.buyerCategory}</KV>
                <KV k="Institutional pricing"><Chip tone="ok">Enabled</Chip></KV>
                <KV k="GSTIN"><span className="font-mono text-[12.5px]">{inst.gstin}</span></KV>
              </div>
            </Panel>
            <Banner tone="info">
              <b className="text-ink">100% advance payment.</b> Orders dispatch
              after full payment is confirmed — your institutional prices
              already include GST.
            </Banner>
            <Panel>
              <PanelHead title="Requests" aside={<Link className="text-[13px] font-semibold text-ember-deep hover:underline" href="/requests">View →</Link>} />
              {openRequest && (
                <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">{openRequest.title}</div>
                    <div className="text-[13px] text-n600">
                      <span className="font-mono text-xs">{openRequest.id}</span> · submitted {openRequest.submitted}
                    </div>
                  </div>
                  <Chip tone="info">{openRequest.statusLabel}</Chip>
                </div>
              )}
            </Panel>
          </div>
        </div>
      </main>
    </RequireBuyer>
  );
}

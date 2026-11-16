import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Banner, Chip, KV, NoteFlag, PageHead, Panel, PanelHead, Sect } from "@/components/buyer-ui";
import { Dest } from "@/components/supplier-shell";
import { getPO } from "@/lib/supplier-api";
import { inr } from "@/lib/format";

/* PO detail — SUP-009 · Workflow N. Terms display the awarded quotation
   version verbatim. Dispatch update is a prototype interaction. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Purchase order ${decodeURIComponent(id).toUpperCase()}` };
}

export default function PoPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="min-h-[50vh]" />}>
      <PoContent params={params} />
    </Suspense>
  );
}

async function PoContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await getPO(decodeURIComponent(id).toUpperCase());
  if (!po) notFound();

  return (
    <main>
      <PageHead
        crumb={<><Link href="/supplier/pos" className="hover:underline">Purchase orders</Link> / <b className="text-ink">{po.id}</b></>}
        title={
          <span className="inline-flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xl tracking-normal">{po.id}</span>
            <Dest direct={po.destination === "direct"} />
          </span>
        }
        sub={
          po.awardedFrom ? (
            <>Issued {po.issued} · from your awarded quotation{" "}
              <span className="font-mono text-xs">{po.awardedFrom.version}</span> on{" "}
              <span className="font-mono text-xs">{po.awardedFrom.reqId}</span></>
          ) : (
            <>Issued {po.issued} · {po.fulfilmentLabel}</>
          )
        }
        actions={
          po.fulfilment === "awaiting-proof" ? (
            <Link href={`/supplier/pos/${po.id}/proof`} className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press">
              Upload delivery proof
            </Link>
          ) : po.fulfilment === "acknowledged" ? (
            <span className="inline-flex h-11 cursor-not-allowed items-center rounded-[2px] bg-n200 px-5 text-sm font-semibold text-n400" aria-disabled>
              Update dispatch (prototype)
            </span>
          ) : undefined
        }
      />

      <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
        <div>
          <Sect>Line</Sect>
          <Panel>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">{po.lineName}</div>
                <div className="num text-[13px] text-n600">{po.lineQty} units × {inr(po.unit)}</div>
              </div>
              <span className="num text-sm font-semibold text-ink">{inr(po.value)}</span>
            </div>
          </Panel>

          <Sect>Fulfilment</Sect>
          <Panel className="px-4 py-3">
            <KV k="Destination">{po.destination === "direct" ? "Direct to recipient" : "ProSmash warehouse"}</KV>
            {po.dispatchBy && <KV k="Dispatch by">{po.dispatchBy}</KV>}
            {po.acknowledgedAt && <KV k="Acknowledged">{po.acknowledgedAt}</KV>}
            {po.shipment && (
              <KV k="Dispatched">{po.shipment.dispatched} · LR <span className="font-mono text-[12.5px]">{po.shipment.lr}</span></KV>
            )}
            {po.dispatchedQty && <KV k="Dispatched qty"><span className="num">{po.dispatchedQty}</span></KV>}
            {po.receivedQty && <KV k="Received at warehouse"><span className="num">{po.receivedQty}</span></KV>}
            <KV k="Status">
              <Chip tone={po.fulfilment === "awaiting-proof" ? "warn" : po.fulfilment === "acknowledged" ? "info" : "ok"}>
                {po.fulfilmentLabel}
              </Chip>
            </KV>
          </Panel>
          <NoteFlag className="mt-2">
            partial shipments &amp; dispatch documents (invoice, e-way bill)
            pending confirmation · discrepancies at goods receipt are resolved
            with prosmash on record
          </NoteFlag>

          {po.terms && (
            <>
              <Sect>Terms — exactly as awarded ({po.awardedFrom?.version})</Sect>
              <Panel>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-5">
                  {[
                    ["Unit price", inr(po.terms.unit), true],
                    ["Quantity", String(po.terms.qty), true],
                    ["Lead time", po.terms.lead, false],
                    ["Valid till", po.terms.validTill, false],
                    ["Payment terms", po.terms.payment, false],
                  ].map(([l, v, num]) => (
                    <div key={l as string}>
                      <div className="font-mono text-[10px] uppercase tracking-wide text-n600">{l}</div>
                      <div className={`mt-0.5 text-sm font-semibold text-ink ${num ? "num" : ""}`}>{v}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </div>

        <div className="lg:sticky lg:top-[132px]">
          <Panel>
            <PanelHead title="Money" aside={<Link className="text-[13px] font-semibold text-ember-deep hover:underline" href="/supplier/payments">Payments →</Link>} />
            <div className="px-4 py-3">
              <KV k="PO value"><span className="num">{inr(po.value)}</span></KV>
              <KV k="Received"><span className="num">{inr(po.received)}</span></KV>
              <KV k="Outstanding"><b className="num">{inr(po.outstanding)}</b></KV>
              <KV k="Terms (as quoted)">{po.paymentTerms}</KV>
            </div>
          </Panel>
          <Banner tone="info" className="mt-3.5">
            <b className="text-ink">Terms come from your quote.</b> This PO
            carries your awarded quotation version verbatim — nothing is
            changed without being recorded.
          </Banner>
        </div>
      </div>
    </main>
  );
}

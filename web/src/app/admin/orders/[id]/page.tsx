import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Chip, DocRow, GstCard, KV, NoteFlag, Panel, Rail, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AuditNote, DestTag, statusTone, tdCls, thCls, trCls } from "@/components/admin-ui";
import { OrderAdvance } from "@/components/admin-order-actions";
import { getAdminCounts, getOrderAdmin } from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* ADM order detail — the full trade record: rail, lines, money, payment
   evidence, complaints. The ONE Ember action is the rail advance, and it
   exists only when the server says a next legal status does. */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${decodeURIComponent(id)}` };
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminOrderDetailContent params={params} />
    </Suspense>
  );
}

async function AdminOrderDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const { id } = await params;
  const d = await getOrderAdmin(decodeURIComponent(id));
  if (!d) notFound();

  const declaredMismatch = d.payment.declaredAmount !== null && d.payment.declaredAmount !== d.total;
  const inFlight = d.rail.some((s) => s.state !== "done");

  return (
    <main>
      <AdminHead
        crumb={<><Link href="/admin/orders" className="hover:underline">Orders</Link> / <b className="text-ink">{d.id}</b></>}
        title={<span className="font-mono text-[22px] md:text-[24px]">{d.id}</span>}
        titleAside={
          <span className="inline-flex items-center gap-2">
            <Chip tone={statusTone(d.status)}>{d.statusLabel}</Chip>
            <DestTag direct={d.direct} />
          </span>
        }
        sub={<>{d.orgName} · placed {d.placed} · <span className="num">{d.lineCount}</span> lines</>}
      />

      <Sect>Order progress</Sect>
      <Rail steps={d.rail} />
      {d.direct && inFlight && !d.nextStatus && (
        <NoteFlag className="mt-2">
          direct order — progress is driven by the supplier&rsquo;s delivery
          proof; no admin advance is available at this stage
        </NoteFlag>
      )}

      <div className="mt-6 grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
        <div className="min-w-0">
          <Sect>Lines</Sect>
          <div className="overflow-x-auto rounded-[2px] border border-n200 bg-chalk">
            <table className="w-full border-collapse text-sm" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th className={thCls}>SKU</th>
                  <th className={thCls}>Item</th>
                  <th className={`${thCls} text-right`}>Qty</th>
                  <th className={`${thCls} text-right`}>Unit</th>
                  <th className={`${thCls} text-right`}>Line total</th>
                </tr>
              </thead>
              <tbody>
                {d.lines.map((l) => (
                  <tr key={l.sku} className={trCls}>
                    <td className={`${tdCls} font-mono text-[12.5px]`}>{l.sku}</td>
                    <td className={tdCls}>{l.name}</td>
                    <td className={`${tdCls} num text-right`}>{l.qty}</td>
                    <td className={`${tdCls} num text-right`}>{inr(l.unit)}</td>
                    <td className={`${tdCls} num text-right font-semibold text-ink`}>{inr(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Sect>Totals</Sect>
          <GstCard
            subtotal={d.subtotalExGst}
            gst={d.gst}
            shipping={d.shipping}
            total={d.total}
            totalLabel="Order total (incl. GST)"
          />

          {d.complaints.length > 0 && (
            <>
              <Sect>Complaints on this order</Sect>
              <Panel>
                {d.complaints.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-start gap-3 border-b border-n100 px-4 py-3 last:border-b-0">
                    <div className="min-w-[200px] flex-1 text-sm text-n800">
                      {c.body}
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-n400">
                        raised {c.created}
                      </div>
                    </div>
                    <Chip tone={statusTone(c.status)}>{c.status}</Chip>
                  </div>
                ))}
              </Panel>
              <NoteFlag className="mt-2">resolve complaints from the complaints queue</NoteFlag>
            </>
          )}
        </div>

        <div className="min-w-0">
          <Sect>Fulfilment control</Sect>
          <Panel className="p-4">
            <KV k="Status"><Chip tone={statusTone(d.status)}>{d.statusLabel}</Chip></KV>
            <KV k="Payment"><Chip tone={statusTone(d.paymentStatus)}>{d.paymentStatusLabel}</Chip></KV>
            {d.nextStatus ? (
              <div className="mt-3">
                <OrderAdvance orderId={d.id} next={d.nextStatus} />
              </div>
            ) : (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-n400">
                no admin advance available at this stage
              </p>
            )}
            <NoteFlag className="mt-3">
              cancellation windows pending obd-17 — no cancel action
            </NoteFlag>
            <AuditNote />
          </Panel>

          <Sect>Ship to</Sect>
          <Panel className="p-4 text-sm text-n800">{d.shipTo}</Panel>

          <Sect>Payment</Sect>
          <Panel>
            <div className="px-4 py-2">
              <KV k="Method">{d.payment.method}</KV>
              <KV k="Reference">
                {d.payment.reference
                  ? <span className="font-mono text-[12.5px]">{d.payment.reference}</span>
                  : "—"}
              </KV>
              <KV k="Declared amount">
                {d.payment.declaredAmount === null ? (
                  "—"
                ) : (
                  <span className={`num ${declaredMismatch ? "font-semibold text-warn" : ""}`}>
                    {inr(d.payment.declaredAmount)}
                    {declaredMismatch && (
                      <span className="ml-1.5 font-mono text-[10px] uppercase">≠ total</span>
                    )}
                  </span>
                )}
              </KV>
              <KV k="Order total"><span className="num">{inr(d.total)}</span></KV>
            </div>
            {d.payment.proofFilename && (
              <div className="border-t border-n100">
                <DocRow
                  file={d.payment.proofFilename}
                  meta={d.payment.proofUploadedAt ? `uploaded ${d.payment.proofUploadedAt}` : undefined}
                />
              </div>
            )}
          </Panel>
          <NoteFlag className="mt-2">
            proof records are metadata-only (adr-0005) · verification happens
            in the payments queue
          </NoteFlag>
        </div>
      </div>
    </main>
  );
}

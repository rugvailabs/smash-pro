import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Banner, Chip, KV, NoteFlag, Panel, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, catLabel, DestTag, statusTone } from "@/components/admin-ui";
import { IssuePo, QuoteActions } from "@/components/admin-quote-actions";
import { getAdminCounts, getProductsAdmin, getRequirementAdmin } from "@/lib/admin-api";
import { inr } from "@/lib/format";
import type { AdminQuoteView } from "@/lib/admin-types";

/* ADM sourcing detail — the QUOTATION COMPARISON surface. A specialized
   side-by-side layout (PORTAL-PRINCIPLES §5), not a stretched table:
   one card per supplier quote with current terms, version timeline and
   the private negotiation thread. Award is the single Ember action per
   requirement; after award the purchase-order issue panel appears. */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Sourcing ${decodeURIComponent(id)}` };
}

export default function SourcingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <SourcingDetailContent params={params} />
    </Suspense>
  );
}

function QuoteCard({
  q, lowest, canAward,
}: {
  q: AdminQuoteView;
  lowest: boolean;
  canAward: boolean;
}) {
  const cur = q.versions.find((v) => v.current) ?? q.versions[q.versions.length - 1];

  return (
    <div className="flex min-w-0 flex-col rounded-[2px] border border-n200 bg-chalk">
      <div className="flex flex-wrap items-center gap-2 border-b border-n200 px-3.5 py-3">
        <b className="font-display text-[15px] font-semibold text-ink">{q.supplierName}</b>
        <span className="ml-auto inline-flex items-center gap-2">
          {lowest && (
            <span className="inline-flex h-6 items-center rounded-[2px] border border-ink px-2 font-mono text-[10px] uppercase tracking-wide text-ink">
              Lowest unit
            </span>
          )}
          <Chip tone={statusTone(q.status)}>{q.statusLabel}</Chip>
        </span>
      </div>

      {/* current terms — the comparison row, identical anatomy per card */}
      {cur ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-3.5 py-3.5 sm:grid-cols-4">
          {([
            ["Unit price", inr(cur.unit), true],
            ["Quantity", cur.quantity, true],
            ["Lead time", cur.lead, false],
            ["Valid till", cur.validTill, false],
          ] as [string, string, boolean][]).map(([l, v, num]) => (
            <div key={l}>
              <div className="font-mono text-[10px] uppercase tracking-wide text-n600">{l}</div>
              <div className={`mt-0.5 text-sm font-semibold text-ink ${num ? "num" : ""} ${l === "Unit price" ? "text-[15px]" : ""}`}>
                {v}
              </div>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-4">
            <div className="font-mono text-[10px] uppercase tracking-wide text-n600">Terms</div>
            <div className="mt-0.5 text-[13px] text-n800">{cur.terms}</div>
          </div>
        </div>
      ) : (
        <p className="px-3.5 py-4 text-sm text-n600">No version submitted yet.</p>
      )}

      {/* version timeline — immutable, never overwritten */}
      {q.versions.length > 0 && (
        <div className="border-t border-n100 px-3.5 py-2.5">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-n400">Versions</div>
          <div className="space-y-1">
            {q.versions.map((v) => (
              <div
                key={v.v}
                className={
                  "flex items-baseline gap-2 text-[12.5px] " +
                  (v.current ? "text-ink" : "text-n600")
                }
              >
                <span className={`font-mono text-[11px] ${v.current ? "text-ember-deep" : "text-n400"}`}>
                  v{v.v}
                </span>
                <b className="num font-semibold">{inr(v.unit)}</b>
                <span className="truncate">· {v.quantity} · {v.lead}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] uppercase text-n400">{v.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* private thread — smash pro right-aligned, supplier left, system centred */}
      <div className="flex-1 border-t border-n100 px-3.5 py-3">
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-n400">
          Thread — private to {q.supplierName}
        </div>
        {q.messages.length === 0 ? (
          <p className="text-[13px] text-n600">No messages yet.</p>
        ) : (
          <div className="space-y-2">
            {q.messages.map((m, i) =>
              m.from === "system" ? (
                <div key={i} className="rounded-[2px] bg-warn-t px-3 py-1.5 text-center font-mono text-[11px] text-warn">
                  {m.body}
                </div>
              ) : (
                <div
                  key={i}
                  className={
                    "max-w-[88%] rounded-[2px] border border-n200 px-3 py-2 text-[13px] " +
                    (m.from === "smash pro" ? "ml-auto bg-paper" : "bg-chalk")
                  }
                >
                  <div className="mb-0.5 font-mono text-[10px] uppercase tracking-wide text-n600">{m.meta}</div>
                  {m.body}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <QuoteActions quotationId={q.quotationId} supplierName={q.supplierName} canAward={canAward} />
    </div>
  );
}

async function SourcingDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const { id } = await params;
  const req = await getRequirementAdmin(decodeURIComponent(id));
  if (!req) notFound();
  const products = await getProductsAdmin();

  const awarded = req.quotes.find((q) => q.status === "awarded");
  const canAward = !awarded && !req.poId;
  const currentUnits = req.quotes
    .map((q) => q.versions.find((v) => v.current)?.unit)
    .filter((u): u is number => u !== undefined);
  const lowestUnit = currentUnits.length > 1 ? Math.min(...currentUnits) : null;

  return (
    <main>
      <AdminHead
        crumb={<><Link href="/admin/sourcing" className="hover:underline">Sourcing</Link> / <b className="text-ink">{req.id}</b></>}
        title={req.title}
        titleAside={
          <span className="inline-flex items-center gap-2">
            <Chip tone={statusTone(req.status)}>{req.statusLabel}</Chip>
            <DestTag direct={req.destination === "direct"} />
          </span>
        }
        sub={
          <>
            <span className="font-mono text-xs">{req.id}</span> · {catLabel(req.catSlug)} ·{" "}
            qty {req.qty} · closes {req.closes}
            {req.requiredBy && <> · required by {req.requiredBy}</>}
          </>
        }
      />

      <div className="grid items-start gap-7 lg:grid-cols-[4fr_8fr]">
        <div className="min-w-0">
          <Sect>Requirement</Sect>
          <Panel className="px-4 py-2">
            <KV k="Category">{catLabel(req.catSlug)}</KV>
            <KV k="Quantity">{req.qty}</KV>
            <KV k="Destination">{req.destination === "direct" ? "Direct to buyer" : "Smash Pro warehouse"}</KV>
            <KV k="Published">{req.published ?? "—"}</KV>
            <KV k="Quotes close">{req.closes}</KV>
            <KV k="Required by">{req.requiredBy ?? "—"}</KV>
            <KV k="Quotations"><span className="num">{req.quoteCount}</span></KV>
          </Panel>
          {req.spec && req.spec.length > 0 && (
            <>
              <Sect>Specification</Sect>
              <Panel className="px-4 py-2">
                {req.spec.map(([k, v]) => (
                  <KV key={k} k={k}>{v}</KV>
                ))}
              </Panel>
            </>
          )}

          {awarded && !req.poId && (
            <div className="mt-7">
              <Sect>Next step</Sect>
              <IssuePo
                quotationId={awarded.quotationId}
                supplierName={awarded.supplierName}
                products={products
                  .filter((p) => p.catSlug === req.catSlug)
                  .map((p) => ({ sku: p.sku, name: p.name, brand: p.brand }))}
              />
            </div>
          )}
          {req.poId && (
            <Banner tone="ok" className="mt-7">
              <b className="text-ink">Purchase order issued.</b>{" "}
              <Link href="/admin/pos" className="font-mono text-[12.5px] underline underline-offset-2">
                {req.poId}
              </Link>{" "}
              carries fulfilment and payment records for this procurement.
            </Banner>
          )}
        </div>

        <div className="min-w-0">
          <Sect>Quotation comparison</Sect>
          {req.quotes.length === 0 ? (
            <EmptyState
              message="No quotations yet."
              hint="Matched suppliers see this requirement in their workspace and quote against it."
            />
          ) : (
            <div className="grid grid-cols-1 items-start gap-4 min-[900px]:grid-cols-2">
              {req.quotes.map((q) => (
                <QuoteCard
                  key={q.quotationId}
                  q={q}
                  lowest={
                    lowestUnit !== null &&
                    q.versions.find((v) => v.current)?.unit === lowestUnit
                  }
                  canAward={canAward && q.status !== "withdrawn" && q.status !== "closed"}
                />
              ))}
            </div>
          )}
          <NoteFlag className="mt-2.5">
            threads are private per supplier — no supplier ever sees another
            quote · awarding closes the remaining quotations · every action is
            recorded (plt-003)
          </NoteFlag>
        </div>
      </div>
    </main>
  );
}

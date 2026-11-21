import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Banner, Chip, DocRow, KV, NoteFlag, PageHead, Panel, PanelHead, Sect, type ChipTone } from "@/components/buyer-ui";
import { getQuote, getRequirement } from "@/lib/supplier-api";
import { PanelSkeleton } from "@/components/skeletons";

/* Requirement detail — SUP-005/006 · Workflow C/E. Direct-to-buyer
   requirements disclose full delivery details only at PO stage (Minimum
   Delivery Information, OBD-19). */

const STATUS_TONE: Record<string, ChipTone> = {
  open: "info", "quoted-revision": "warn", awarded: "ok", closed: "neu",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const r = await getRequirement(decodeURIComponent(id).toUpperCase());
  return { title: r ? `${r.id} — ${r.title}` : "Requirement not found" };
}

export default function RequirementPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <RequirementContent params={params} />
    </Suspense>
  );
}

async function RequirementContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reqId = decodeURIComponent(id).toUpperCase();
  const [r, quote] = await Promise.all([getRequirement(reqId), getQuote(reqId)]);
  if (!r) notFound();

  const canQuote = r.status === "open" || r.status === "quoted-revision";
  const items = r.items && r.items.length > 1 ? r.items : null;

  return (
    <main>
      <PageHead
        crumb={<><Link href="/supplier/requirements" className="hover:underline">Requirements</Link> / <b className="text-ink">{r.id}</b></>}
        title={r.title}
        sub={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs">{r.id}</span> · {r.category} ·{" "}
            {r.published ? <>published {r.published}</> : <>qty {r.qty}</>}
            <Chip tone={STATUS_TONE[r.status] ?? "neu"}>{r.statusLabel}</Chip>
          </span>
        }
        actions={
          canQuote ? (
            <Link href={`/supplier/requirements/${r.id}/quote`} className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press">
              {quote ? "Revise quotation" : "Submit quotation"}
            </Link>
          ) : quote ? (
            <Link href={`/supplier/quotes/${r.id}`} className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk px-5 text-sm font-semibold text-ink hover:border-ink">
              View your quotation
            </Link>
          ) : undefined
        }
      />

      {r.status === "open" && (
        <Banner tone={r.closesToday ? "warn" : "info"} className="mb-5">
          <b className="text-ink">Quotes close {r.closes}.</b>{" "}
          {quote ? "Your quotation is on record — you may revise it while this stays open." : "You have not quoted on this requirement yet."}
        </Banner>
      )}
      {r.status === "quoted-revision" && (
        <Banner tone="warn" className="mb-5">
          <b className="text-ink">{r.statusLabel}.</b>{" "}
          <Link href={`/supplier/quotes/${r.id}`} className="underline underline-offset-2">Open the quotation thread</Link> for details.
        </Banner>
      )}
      {r.status === "awarded" && (
        <Banner tone="ok" className="mb-5">
          <b className="text-ink">Awarded to you.</b>{" "}
          {r.poId ? <>Purchase order <Link href={`/supplier/pos/${r.poId}`} className="underline underline-offset-2">{r.poId}</Link> carries fulfilment.</> : "A purchase order will follow."}
        </Banner>
      )}
      {r.status === "closed" && (
        <Banner tone="info" className="mb-5">
          <b className="text-ink">Closed.</b> This requirement is no longer accepting quotations.
        </Banner>
      )}

      <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
        <div>
          <Sect>Requirement</Sect>
          <Panel className="px-4 py-3">
            <KV k="Category">{r.category}</KV>
            <KV k="Quantity">{r.qty}</KV>
            <KV k="Deliver to">{r.destination}</KV>
            {r.requiredBy && <KV k="Required by">{r.requiredBy}</KV>}
          </Panel>

          {items && (
            <>
              <Sect>Products in this requirement</Sect>
              <Panel className="divide-y divide-n100">
                {items.map((it, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1 text-sm text-ink">{it.title}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-n600">{it.catSlug}</span>
                    <span className="text-[13px] font-semibold text-ink">{it.qty}</span>
                  </div>
                ))}
              </Panel>
            </>
          )}

          {r.spec && r.spec.length > 0 && (
            <>
              <Sect>Specification</Sect>
              <Panel className="px-4 py-3">
                {r.spec.map(([k, v]) => <KV key={k} k={k}>{v}</KV>)}
              </Panel>
            </>
          )}

          {(r.attachments ?? []).length > 0 && (
            <>
              <Sect>Attachments from Smash Pro</Sect>
              <Panel>
                {(r.attachments ?? []).map((a) => (
                  <DocRow key={a.file} file={a.file} meta={a.meta}
                    action={<span className="cursor-not-allowed text-[13px] font-semibold text-n400" aria-disabled>View (prototype)</span>} />
                ))}
              </Panel>
            </>
          )}
        </div>

        <div className="lg:sticky lg:top-[132px]">
          <Panel>
            <PanelHead title="Your submission status" />
            <div className="px-4 py-3">
              <KV k="Status"><Chip tone={STATUS_TONE[r.status] ?? "neu"}>{quote ? quote.statusLabel : "Not quoted"}</Chip></KV>
              <KV k="Quotes close">{r.closes}</KV>
              {quote && <KV k="Current offer"><span className="num">{quote.versions[0]?.v ?? "v1"}</span></KV>}
              <KV k="Revisions">{canQuote ? "Allowed while open" : "Closed to revision"}</KV>
            </div>
          </Panel>
          {canQuote && (
            <Link
              href={`/supplier/requirements/${r.id}/quote`}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press"
            >
              {quote ? "Revise quotation" : "Submit quotation"}
            </Link>
          )}
          <NoteFlag className="mt-2.5">
            quoting after closure only on smash pro request — policy pending ·
            partial-quantity quotes pending
          </NoteFlag>
        </div>
      </div>
    </main>
  );
}

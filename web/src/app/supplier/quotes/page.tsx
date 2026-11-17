import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag, PageHead, Panel } from "@/components/buyer-ui";
import { EmptyState } from "@/components/empty-state";
import { PanelSkeleton } from "@/components/skeletons";
import { getQuotes } from "@/lib/supplier-api";
import { inr } from "@/lib/format";
import type { SupplierQuote } from "@/lib/types";

/* Quotations index — SUP-007 · Workflow E. Own quotations only; competing
   quotations and other suppliers are NEVER visible (PLT-001 AC2). Renders
   inside the role-gated supplier shell. */

export const metadata: Metadata = { title: "Quotations" };

function Row({ q }: { q: SupplierQuote }) {
  const current = q.versions.find((v) => v.current);
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3.5 last:border-b-0">
      <span className="font-mono text-[12.5px] text-ink">{q.reqId}</span>
      <div className="min-w-[220px] flex-1">
        <div className="text-sm font-medium text-ink">{q.title}</div>
        <div className="text-[13px] text-n600">
          {q.category} · qty {q.quantity} ·{" "}
          <span className="num">{inr(q.unit)}</span> / unit · lead {q.lead} ·
          valid till {q.validTill}
        </div>
      </div>
      {current && <span className="font-mono text-[11px] text-n600">{current.v} · current</span>}
      <Chip tone={q.statusLabel.toLowerCase().includes("revision") ? "warn" : "neu"}>
        {q.statusLabel}
      </Chip>
      <Link
        href={`/supplier/quotes/${q.reqId}`}
        className="inline-flex h-8 items-center rounded-[2px] bg-ember-deep px-3 text-[13px] font-semibold text-white hover:bg-ember-press"
      >
        Open quotation
      </Link>
    </div>
  );
}

export default function QuotesPage() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <QuotesContent />
    </Suspense>
  );
}

async function QuotesContent() {
  const quotes = await getQuotes();

  return (
    <main>
      <PageHead
        title="Quotations"
        sub="Your submitted quotations — versioned offers and their negotiation threads with ProSmash"
      />
      {quotes.length ? (
        <Panel>{quotes.map((q) => <Row key={q.reqId} q={q} />)}</Panel>
      ) : (
        <EmptyState
          message="No quotations yet."
          hint="Open a matched requirement to submit your first quotation."
          actionLabel="View requirements"
          actionHref="/supplier/requirements"
        />
      )}
      <NoteFlag className="mt-2.5">
        own quotations only — competing offers are never visible · every
        revision is a new immutable version
      </NoteFlag>
    </main>
  );
}

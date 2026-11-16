import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Banner, Chip, NoteFlag, PageHead, Panel, Sect } from "@/components/buyer-ui";
import { getQuote } from "@/lib/supplier-api";
import { inr } from "@/lib/format";

/* Quotation detail + negotiation — SUP-007/008 · Workflows E/F. Own
   quotation only — competing quotations and other suppliers are NEVER
   visible. Private thread with ProSmash; formal revision requests appear
   as system markers. Messages immutable. */

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="min-h-[50vh]" />}>
      <QuoteDetailContent params={params} />
    </Suspense>
  );
}

async function QuoteDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await getQuote(decodeURIComponent(id).toUpperCase());
  if (!q) notFound();

  const btnSec = "inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink";

  return (
    <main>
      <PageHead
        crumb={<><Link href="/supplier/requirements" className="hover:underline">Requirements</Link> / <b className="text-ink">Quotation · {q.reqId}</b></>}
        title={q.title}
        sub={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs">{q.reqId}</span> · {q.category} · qty {q.qty} · closes {q.closes}
            <Chip tone="warn">{q.statusLabel}</Chip>
          </span>
        }
        actions={
          <>
            <a href="#" className={btnSec}>Withdraw quotation</a>
            <span className="inline-flex h-11 cursor-not-allowed items-center rounded-[2px] bg-n200 px-4 text-sm font-semibold text-n400" aria-disabled>
              Submit revision (prototype)
            </span>
          </>
        }
      />

      <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
        <div>
          <Sect>Your current quotation</Sect>
          <Panel>
            <div className="flex flex-wrap items-center gap-3 border-b border-n200 px-4 py-3">
              <b className="font-display text-base font-semibold text-ink">Your offer</b>
              <span className="font-mono text-[11px] text-n600">v2 · current</span>
              <span className="ml-auto"><Chip tone="warn">{q.statusLabel}</Chip></span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-5">
              {[
                ["Unit price", inr(q.unit), true],
                ["Quantity", q.quantity, true],
                ["Lead time", q.lead, false],
                ["Valid till", q.validTill, false],
                ["Terms", q.terms, false],
              ].map(([l, v, num]) => (
                <div key={l as string}>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-n600">{l}</div>
                  <div className={`mt-0.5 text-sm font-semibold text-ink ${num ? "num" : ""}`}>{v}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 border-t border-n100 px-4 py-2.5 text-xs text-n600">
              <span>⎙ {q.attachments} attachment</span>
              <span className="ml-auto font-mono">{q.reqId}</span>
            </div>
          </Panel>

          <Sect>Negotiation with ProSmash</Sect>
          <Panel className="p-4">
            <div className="space-y-3">
              {q.thread.map((m, i) =>
                m.from === "system" ? (
                  <div key={i} className="rounded-[2px] bg-warn-t px-3 py-2 text-center font-mono text-[11px] text-warn">
                    {m.text}
                  </div>
                ) : (
                  <div
                    key={i}
                    className={
                      "max-w-[85%] rounded-[2px] border px-3.5 py-2.5 text-sm " +
                      (m.from === "you" ? "ml-auto border-n200 bg-paper" : "border-n200 bg-chalk")
                    }
                  >
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-n600">{m.meta}</div>
                    {m.text}
                  </div>
                )
              )}
            </div>
            <div className="mt-4 flex gap-2.5">
              <input
                type="text" placeholder="Write a message to ProSmash" aria-label="Message"
                className="h-10 flex-1 rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink placeholder:text-n400"
              />
              <button className="inline-flex h-10 cursor-not-allowed items-center rounded-[2px] bg-n200 px-4 text-sm font-semibold text-n400" aria-disabled>
                Send (prototype)
              </button>
            </div>
          </Panel>
        </div>

        <div className="lg:sticky lg:top-[132px]">
          <Sect>Version history</Sect>
          <div className="space-y-2.5">
            {q.versions.map((v) => (
              <div
                key={v.v}
                className={
                  "rounded-[2px] border bg-chalk px-3.5 py-2.5 text-[13px] " +
                  (v.current ? "border-ember-deep shadow-[inset_2px_0_0_var(--color-ember)]" : "border-n200 text-n600")
                }
              >
                <span className="mr-2 font-mono text-[11px] text-n600">{v.v}</span>
                <b className={`num ${v.current ? "text-ink" : "font-normal"}`}>{inr(v.unit)}</b>
                {" — "}{v.summary} · {v.date}
              </div>
            ))}
          </div>
          <NoteFlag className="mt-2">every revision is a new immutable version — nothing is overwritten</NoteFlag>
          <Banner tone="info" className="mt-3.5">
            <b className="text-ink">Private thread.</b> This negotiation is
            between Meerut Sports Works and ProSmash only. Other suppliers and
            their offers are never visible to you — or yours to them.
          </Banner>
        </div>
      </div>

    </main>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Banner, Chip, DocRow, KV, NoteFlag, PageHead, Panel, PanelHead, Sect } from "@/components/buyer-ui";
import { getRequirement } from "@/lib/supplier-api";

/* Requirement detail — SUP-005/006 · Workflow C/E. Direct-to-buyer
   requirements disclose full delivery details only at PO stage (Minimum
   Delivery Information, OBD-19). */

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
    <Suspense fallback={<main className="min-h-[50vh]" />}>
      <RequirementContent params={params} />
    </Suspense>
  );
}

async function RequirementContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await getRequirement(decodeURIComponent(id).toUpperCase());
  if (!r || !r.spec) notFound();

  return (
    <main>
      <PageHead
        crumb={<><Link href="/supplier/requirements" className="hover:underline">Requirements</Link> / <b className="text-ink">{r.id}</b></>}
        title={r.title}
        sub={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs">{r.id}</span> · {r.category} · published {r.published}
            <Chip tone="info">Open</Chip>
          </span>
        }
        actions={
          <Link href={`/supplier/requirements/${r.id}/quote`} className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press">
            Submit quotation
          </Link>
        }
      />

      <Banner tone="warn" className="mb-5">
        <b className="text-ink">Quotation deadline: today, 18:00 IST.</b> You
        have not quoted on this requirement yet.
      </Banner>

      <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
        <div>
          <Sect>Specification</Sect>
          <Panel className="px-4 py-3">
            {r.spec.map(([k, v]) => <KV key={k} k={k}>{v}</KV>)}
          </Panel>
          <Sect>Attachments from ProSmash</Sect>
          <Panel>
            {(r.attachments ?? []).map((a) => (
              <DocRow key={a.file} file={a.file} meta={a.meta}
                action={<span className="cursor-not-allowed text-[13px] font-semibold text-n400" aria-disabled>View (prototype)</span>} />
            ))}
          </Panel>
        </div>

        <div className="lg:sticky lg:top-[132px]">
          <Panel>
            <PanelHead title="Your submission status" />
            <div className="px-4 py-3">
              <KV k="Status"><Chip tone="info">Not quoted</Chip></KV>
              <KV k="Deadline">14 Nov 2026, 18:00 IST</KV>
              <KV k="Revisions">Allowed while open</KV>
            </div>
          </Panel>
          <Link
            href={`/supplier/requirements/${r.id}/quote`}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press"
          >
            Submit quotation
          </Link>
          <NoteFlag className="mt-2.5">
            quoting after closure only on prosmash request — policy pending ·
            partial-quantity quotes pending
          </NoteFlag>
        </div>
      </div>
    </main>
  );
}

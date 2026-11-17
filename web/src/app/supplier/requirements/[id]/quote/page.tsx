import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHead } from "@/components/buyer-ui";
import { QuoteForm } from "@/components/quote-form";
import { getRequirement } from "@/lib/supplier-api";
import { PanelSkeleton } from "@/components/skeletons";

/* Submit quotation — SUP-006 · Workflow E step 1. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Submit quotation — ${decodeURIComponent(id).toUpperCase()}` };
}

export default function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <QuoteContent params={params} />
    </Suspense>
  );
}

async function QuoteContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await getRequirement(decodeURIComponent(id).toUpperCase());
  if (!r) notFound();

  return (
    <main>
      <PageHead
        crumb={
          <>
            <Link href="/supplier/requirements" className="hover:underline">Requirements</Link> /{" "}
            <Link href={`/supplier/requirements/${r.id}`} className="hover:underline">{r.id}</Link> /{" "}
            <b className="text-ink">Submit quotation</b>
          </>
        }
        title={<>Quotation — <span className="font-mono text-lg tracking-normal">{r.id}</span></>}
        sub={`${r.title.split(" — ")[0]} × ${r.qty.split(" ")[0]} · deadline today 18:00 IST`}
      />
      <QuoteForm reqId={r.id} />
    </main>
  );
}

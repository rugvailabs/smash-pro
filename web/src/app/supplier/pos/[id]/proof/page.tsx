import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHead } from "@/components/buyer-ui";
import { Dest } from "@/components/supplier-shell";
import { DeliveryProof } from "@/components/delivery-proof";
import { getPO } from "@/lib/supplier-api";

/* Delivery proof upload for an eligible direct-shipment PO (OBD-19). */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Delivery proof — ${decodeURIComponent(id).toUpperCase()}` };
}

export default function ProofPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="min-h-[50vh]" />}>
      <ProofContent params={params} />
    </Suspense>
  );
}

async function ProofContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await getPO(decodeURIComponent(id).toUpperCase());
  if (!po || po.destination !== "direct" || !po.minDeliveryInfo) notFound();

  return (
    <main>
      <PageHead
        crumb={<><Link href="/supplier/pos" className="hover:underline">Purchase orders</Link> / <b className="text-ink">{po.id} · Delivery proof</b></>}
        title={
          <span className="inline-flex flex-wrap items-center gap-2.5">
            Delivery proof — <span className="font-mono text-xl tracking-normal">{po.id}</span>
            <Dest direct />
          </span>
        }
        sub="Dispatched 13 Nov 2026 · dispatch was released after ProSmash confirmed the buyer's advance payment"
      />
      <DeliveryProof po={po} />
    </main>
  );
}

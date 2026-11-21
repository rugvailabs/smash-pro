import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead } from "@/components/admin-ui";
import { InvoiceGenerateForm } from "@/components/admin-invoice-form";
import { getAdminCounts, getInvoiceablePos } from "@/lib/admin-api";
import { gstinStateCode, SMASH_PRO_PROFILE } from "@/lib/company-profile";

export const metadata: Metadata = { title: "Generate invoice" };

export default function NewInvoicePage({ searchParams }: { searchParams: Promise<{ reqId?: string }> }) {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <NewInvoiceContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NewInvoiceContent({ searchParams }: { searchParams: Promise<{ reqId?: string }> }) {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const { reqId } = await searchParams;
  if (!reqId) notFound();
  const data = await getInvoiceablePos(decodeURIComponent(reqId).toUpperCase());
  if (!data) notFound();

  const suggestedIntra = gstinStateCode(data.supplierGstin) === SMASH_PRO_PROFILE.stateCode;

  return (
    <main>
      <AdminHead
        crumb={<><Link href="/admin/pos" className="hover:underline">Purchase orders</Link> / <b className="text-ink">Generate invoice</b></>}
        title={`Record invoice — ${data.reqTitle}`}
        sub={`Supplier: ${data.supplierName} · ${data.pos.length} purchase order line${data.pos.length === 1 ? "" : "s"} available to invoice`}
      />
      <InvoiceGenerateForm
        reqId={decodeURIComponent(reqId).toUpperCase()}
        pos={data.pos}
        suggestedIntra={suggestedIntra}
      />
    </main>
  );
}

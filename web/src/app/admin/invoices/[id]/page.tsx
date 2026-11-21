import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Chip } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, statusTone } from "@/components/admin-ui";
import { DownloadInvoice, MarkInvoiceSent } from "@/components/admin-invoice-actions";
import { InvoiceDocument } from "@/components/invoice-document";
import { getAdminCounts, getInvoiceAdmin } from "@/lib/admin-api";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Invoice ${decodeURIComponent(id).toUpperCase()}` };
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <InvoiceDetailContent params={params} />
    </Suspense>
  );
}

async function InvoiceDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const { id } = await params;
  const inv = await getInvoiceAdmin(decodeURIComponent(id).toUpperCase());
  if (!inv) notFound();

  return (
    <main>
      <AdminHead
        crumb={<><Link href="/admin/invoices" className="hover:underline">Invoices</Link> / <b className="text-ink">{inv.id}</b></>}
        title={`Invoice — ${inv.reqTitle}`}
        titleAside={<Chip tone={statusTone(inv.status)}>{inv.status === "sent" ? "Sent" : "Draft"}</Chip>}
        sub={<>{inv.supplierName} · supplier&rsquo;s invoice {inv.supplierInvoiceNo} · {inv.supplierInvoiceDate} · covers {inv.poIds.join(", ")}</>}
        actions={
          <div className="flex items-center gap-2">
            <DownloadInvoice id={inv.id} />
            {inv.status === "draft" && <MarkInvoiceSent id={inv.id} />}
          </div>
        }
      />
      <InvoiceDocument inv={inv} />
    </main>
  );
}

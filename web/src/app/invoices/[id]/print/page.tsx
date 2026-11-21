import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdminGate } from "@/components/admin-shell";
import { InvoiceDocument } from "@/components/invoice-document";
import { PrintButton } from "@/components/print-button";
import { getAdminCounts, getInvoiceAdmin } from "@/lib/admin-api";

/* Standalone print-perfect view — the "Download" target from the admin
   invoice detail page. Outside the admin shell deliberately: a clean
   document with nothing to strip for print, plus a Print/Save-as-PDF
   button that disappears in the printed output (print:hidden). */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Invoice ${decodeURIComponent(id).toUpperCase()}` };
}

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const { id } = await params;
  const inv = await getInvoiceAdmin(decodeURIComponent(id).toUpperCase());
  if (!inv) notFound();

  return (
    <main className="min-h-screen bg-n100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[920px] items-center justify-between print:hidden">
        <span className="text-sm text-n600">{inv.id} · {inv.status === "sent" ? "Sent" : "Draft"}</span>
        <PrintButton />
      </div>
      <InvoiceDocument inv={inv} />
    </main>
  );
}

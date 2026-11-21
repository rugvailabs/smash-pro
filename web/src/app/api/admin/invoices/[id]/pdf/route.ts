import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoiceAdmin } from "@/lib/admin-api";
import { InvoicePdfDocument } from "@/components/invoice-pdf";

/* GET /api/admin/invoices/[id]/pdf — the invoice as a real .pdf file
 * (@react-pdf/renderer, pure JS — no headless browser). Alongside, not
 * instead of, the print-perfect HTML view at /invoices/[id]/print. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const invId = decodeURIComponent(id).toUpperCase();
  const inv = await getInvoiceAdmin(invId);
  if (!inv) return new Response("Not found", { status: 404 });

  const buffer = await renderToBuffer(InvoicePdfDocument({ inv }));
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${inv.id}.pdf"`,
    },
  });
}

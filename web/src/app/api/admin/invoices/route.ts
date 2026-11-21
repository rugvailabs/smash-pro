import { createInvoice } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      reqId?: string; supplierInvoiceNo?: string; supplierInvoiceDate?: string;
      placeOfSupply?: string; transportMode?: string; paymentTerms?: string;
      taxMode?: string;
      lines?: {
        poId?: string; description?: string; hsn?: string | null; qty?: number; uom?: string;
        rate?: number; disc?: number; gstPercent?: number | null;
      }[];
    };
    for (const k of ["reqId", "supplierInvoiceNo", "supplierInvoiceDate", "taxMode"] as const) {
      if (!body[k]) return json({ error: `Missing field: ${k}` }, 400);
    }
    if (!Array.isArray(body.lines) || body.lines.length === 0) {
      return json({ error: "Select at least one purchase order line" }, 400);
    }
    for (const ln of body.lines) {
      if (!ln.poId || typeof ln.qty !== "number" || typeof ln.rate !== "number") {
        return json({ error: "Each line needs a PO, quantity and rate" }, 400);
      }
    }
    const out = await createInvoice({
      reqId: body.reqId!, supplierInvoiceNo: body.supplierInvoiceNo!,
      supplierInvoiceDate: body.supplierInvoiceDate!,
      placeOfSupply: body.placeOfSupply ?? "", transportMode: body.transportMode ?? "",
      paymentTerms: body.paymentTerms ?? "",
      taxMode: body.taxMode as "intra" | "inter",
      lines: body.lines.map((ln) => ({
        poId: ln.poId!, description: ln.description, hsn: ln.hsn,
        qty: ln.qty!, uom: ln.uom ?? "Pcs", rate: ln.rate!,
        disc: ln.disc, gstPercent: ln.gstPercent,
      })),
    });
    return json(out);
  });
}

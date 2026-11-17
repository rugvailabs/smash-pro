import { submitQuotation } from "@/server/supplier";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      reqId?: string; unit?: number; quantity?: string; lead?: string;
      validTill?: string; terms?: string; note?: string;
    };
    for (const k of ["reqId", "unit", "quantity", "lead", "validTill"] as const) {
      if (!body[k]) return json({ error: `Missing field: ${k}` }, 400);
    }
    if (typeof body.unit !== "number" || !Number.isFinite(body.unit) || body.unit <= 0 || body.unit > 1_000_000) {
      return json({ error: "Unit price must be between ₹0.01 and ₹10,00,000" }, 400);
    }
    for (const [k, max] of [["quantity", 120], ["lead", 120], ["validTill", 120], ["terms", 300], ["note", 2000]] as const) {
      const v = body[k];
      if (typeof v === "string" && v.length > max) return json({ error: `${k} is too long` }, 400);
    }
    const out = await submitQuotation({
      reqId: body.reqId!, unit: body.unit!, quantity: body.quantity!,
      lead: body.lead!, validTill: body.validTill!, terms: body.terms ?? "", note: body.note,
    });
    return json(out);
  });
}

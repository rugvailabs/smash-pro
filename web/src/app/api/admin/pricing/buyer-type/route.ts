import { upsertBuyerTypeDiscount } from "@/server/admin";
import { handle, json } from "@/server/http";

/* Create / edit a buyer-category discount (upsert — one rate per buyer type).
   Percentage at the boundary; the service converts to basis points and
   requires an admin session. */
export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { buyerType?: string; discountPct?: number; active?: boolean };
    if (!body.buyerType) return json({ error: "A buyer category is required" }, 400);
    if (typeof body.discountPct !== "number") return json({ error: "A discount percentage is required" }, 400);
    const out = await upsertBuyerTypeDiscount({
      buyerType: body.buyerType,
      discountPct: body.discountPct,
      active: body.active,
    });
    return json(out);
  });
}

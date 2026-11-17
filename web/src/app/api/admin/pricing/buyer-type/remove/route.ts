import { removeBuyerTypeDiscount } from "@/server/admin";
import { handle, json } from "@/server/http";

/* Remove a buyer-category rate entirely — that type reverts to the standard
   listed price for its approved buyers. */
export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { buyerType?: string };
    if (!body.buyerType) return json({ error: "A buyer category is required" }, 400);
    await removeBuyerTypeDiscount(body.buyerType);
    return json({ ok: true });
  });
}

import { setBuyerTypeDiscountActive } from "@/server/admin";
import { handle, json } from "@/server/http";

/* Activate / deactivate a buyer-category rate without deleting it. */
export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { buyerType?: string; active?: boolean };
    if (!body.buyerType) return json({ error: "A buyer category is required" }, 400);
    if (typeof body.active !== "boolean") return json({ error: "An active state is required" }, 400);
    await setBuyerTypeDiscountActive(body.buyerType, body.active);
    return json({ ok: true });
  });
}

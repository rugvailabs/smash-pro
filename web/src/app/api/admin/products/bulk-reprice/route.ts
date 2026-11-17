import { bulkRepriceProducts } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { updates?: { sku?: string; std?: number }[] };
    if (!Array.isArray(body.updates)) return json({ error: "updates must be a list" }, 400);
    const updates = body.updates.map((u) => ({ sku: String(u?.sku ?? ""), std: Number(u?.std) }));
    const out = await bulkRepriceProducts(updates);
    return json(out);
  });
}

import { bulkSetProductsActive } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { skus?: string[]; active?: boolean };
    if (!Array.isArray(body.skus)) return json({ error: "skus must be a list of SKUs" }, 400);
    if (typeof body.active !== "boolean") return json({ error: "active must be true or false" }, 400);
    const out = await bulkSetProductsActive(body.skus, body.active);
    return json(out);
  });
}

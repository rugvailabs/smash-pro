import { bulkApplyCategoryDiscount } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { catSlug?: string; discountBp?: number };
    if (!body.catSlug) return json({ error: "A category is required" }, 400);
    if (typeof body.discountBp !== "number") return json({ error: "A discount in basis points is required" }, 400);
    const out = await bulkApplyCategoryDiscount(body.catSlug, body.discountBp);
    return json(out);
  });
}

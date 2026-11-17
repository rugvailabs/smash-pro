import { createPriceRule } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      scope?: string; orgId?: number; catSlug?: string; sku?: string; discountBp?: number;
    };
    if (!body.scope) return json({ error: "Missing field: scope" }, 400);
    if (typeof body.discountBp !== "number") return json({ error: "Missing field: discountBp" }, 400);
    const out = await createPriceRule({
      scope: body.scope, orgId: body.orgId, catSlug: body.catSlug,
      sku: body.sku, discountBp: body.discountBp,
    });
    return json(out);
  });
}

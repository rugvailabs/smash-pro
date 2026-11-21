import { bulkUpdateProductFields } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      skus?: string[]; catSlug?: string; sub?: string; brandId?: number | null;
    };
    if (!Array.isArray(body.skus)) return json({ error: "skus must be a list of SKUs" }, 400);
    const patch: { catSlug?: string; sub?: string; brandId?: number | null } = {};
    if (body.catSlug !== undefined) patch.catSlug = body.catSlug;
    if (body.sub !== undefined) patch.sub = body.sub;
    if (body.brandId !== undefined) patch.brandId = body.brandId;
    const out = await bulkUpdateProductFields(body.skus, patch);
    return json(out);
  });
}

import { createProduct } from "@/server/admin";
import { handle, json } from "@/server/http";
import type { PriceMode } from "@/lib/pricing-calc";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      sku?: string; name?: string; catSlug?: string; sub?: string;
      meta?: string; specs?: [string, string][];
      mrp?: number;
      purchaseMode?: PriceMode; purchaseValue?: number;
      marginMode?: PriceMode; marginValue?: number;
      brandId?: number | null;
      img?: string | null;
    };
    for (const k of ["sku", "name", "catSlug", "sub"] as const) {
      if (!body[k]) return json({ error: `Missing field: ${k}` }, 400);
    }
    for (const k of ["mrp", "purchaseValue", "marginValue"] as const) {
      if (typeof body[k] !== "number") return json({ error: `Missing field: ${k}` }, 400);
    }
    for (const k of ["purchaseMode", "marginMode"] as const) {
      if (!body[k]) return json({ error: `Missing field: ${k}` }, 400);
    }
    const out = await createProduct({
      sku: body.sku!, name: body.name!, catSlug: body.catSlug!, sub: body.sub!,
      meta: body.meta, specs: body.specs,
      mrp: body.mrp!,
      purchaseMode: body.purchaseMode!, purchaseValue: body.purchaseValue!,
      marginMode: body.marginMode!, marginValue: body.marginValue!,
      brandId: body.brandId ?? null,
      img: body.img ?? null,
    });
    return json(out);
  });
}

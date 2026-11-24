import { updateProduct } from "@/server/admin";
import { handle, json } from "@/server/http";
import type { PriceMode } from "@/lib/pricing-calc";

export async function PATCH(req: Request, ctx: { params: Promise<{ sku: string }> }) {
  return handle(async () => {
    const { sku } = await ctx.params;
    const body = (await req.json()) as {
      active?: boolean; std?: number; img?: string | null;
      hsn?: string | null; gstPercent?: number | null;
      supplierCode?: string | null; msp?: number | null;
      color?: string | null; size?: string | null; inStock?: boolean; qty?: number;
      name?: string; catSlug?: string; sub?: string; meta?: string;
      brandId?: number | null; groupKey?: string | null;
      marginMode?: PriceMode; marginValue?: number;
    };
    await updateProduct(decodeURIComponent(sku).toUpperCase(), {
      active: body.active, std: body.std, img: body.img,
      hsn: body.hsn, gstPercent: body.gstPercent,
      supplierCode: body.supplierCode, msp: body.msp,
      color: body.color, size: body.size, inStock: body.inStock, qty: body.qty,
      name: body.name, catSlug: body.catSlug, sub: body.sub, meta: body.meta,
      brandId: body.brandId, groupKey: body.groupKey,
      marginMode: body.marginMode, marginValue: body.marginValue,
    });
    return json({ ok: true });
  });
}

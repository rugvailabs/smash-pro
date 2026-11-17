import { updateProduct } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function PATCH(req: Request, ctx: { params: Promise<{ sku: string }> }) {
  return handle(async () => {
    const { sku } = await ctx.params;
    const body = (await req.json()) as { active?: boolean; std?: number };
    await updateProduct(decodeURIComponent(sku).toUpperCase(), {
      active: body.active, std: body.std,
    });
    return json({ ok: true });
  });
}

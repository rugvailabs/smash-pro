import { reorderToCart } from "@/server/buyer";
import { handle, json } from "@/server/http";

/* POST /api/orders/[id]/reorder — re-add a past order's lines to the cart.
   Org-scoped (404 if the order isn't the buyer's). Inactive/absent SKUs are
   skipped and reported rather than failing the whole reorder. */

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const out = await reorderToCart(decodeURIComponent(id).toUpperCase());
    return json(out);
  });
}

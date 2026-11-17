import { acknowledgePo } from "@/server/supplier";
import { handle, json } from "@/server/http";

/** POST /api/supplier/pos/[id]/acknowledge — issued → acknowledged. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    await acknowledgePo(decodeURIComponent(id).toUpperCase());
    return json({ ok: true });
  });
}

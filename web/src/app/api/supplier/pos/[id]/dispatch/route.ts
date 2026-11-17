import { recordDispatch } from "@/server/supplier";
import { handle, json } from "@/server/http";

/** POST /api/supplier/pos/[id]/dispatch — acknowledged → awaiting-proof
 *  (DIRECT POs only). Body: { dispatched, lr, qtyShipped }. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const body = (await req.json()) as { dispatched?: string; lr?: string; qtyShipped?: string };
    for (const [k, max] of [["dispatched", 80], ["lr", 80], ["qtyShipped", 80]] as const) {
      const v = body[k];
      if (typeof v === "string" && v.length > max) return json({ error: `${k} is too long` }, 400);
    }
    await recordDispatch(decodeURIComponent(id).toUpperCase(), {
      dispatched: body.dispatched ?? "", lr: body.lr ?? "", qtyShipped: body.qtyShipped ?? "",
    });
    return json({ ok: true });
  });
}

import { withdrawQuotation } from "@/server/supplier";
import { handle, json } from "@/server/http";

/** POST /api/supplier/quotes/[reqId]/withdraw — withdraw an owned quotation
 *  (409 if already awarded / closed / withdrawn). */
export async function POST(_req: Request, ctx: { params: Promise<{ reqId: string }> }) {
  return handle(async () => {
    const { reqId } = await ctx.params;
    await withdrawQuotation(decodeURIComponent(reqId).toUpperCase());
    return json({ ok: true });
  });
}

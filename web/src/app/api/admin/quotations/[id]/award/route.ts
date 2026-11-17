import { awardQuotation } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const quotationId = Number(id);
    if (!Number.isInteger(quotationId) || quotationId <= 0) {
      return json({ error: "Invalid quotation id" }, 400);
    }
    await awardQuotation(quotationId);
    return json({ ok: true });
  });
}

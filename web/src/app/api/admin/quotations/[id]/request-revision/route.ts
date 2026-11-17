import { requestQuoteRevision } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const quotationId = Number(id);
    if (!Number.isInteger(quotationId) || quotationId <= 0) {
      return json({ error: "Invalid quotation id" }, 400);
    }
    const body = (await req.json()) as { note?: string };
    if (!body.note?.trim()) return json({ error: "A revision note is required" }, 400);
    await requestQuoteRevision(quotationId, body.note);
    return json({ ok: true });
  });
}

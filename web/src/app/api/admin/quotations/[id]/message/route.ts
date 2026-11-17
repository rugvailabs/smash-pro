import { sendQuoteMessage } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const quotationId = Number(id);
    if (!Number.isInteger(quotationId) || quotationId <= 0) {
      return json({ error: "Invalid quotation id" }, 400);
    }
    const body = (await req.json()) as { text?: string };
    if (!body.text?.trim()) return json({ error: "A message is required" }, 400);
    await sendQuoteMessage(quotationId, body.text);
    return json({ ok: true });
  });
}

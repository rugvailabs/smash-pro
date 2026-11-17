import { sendNegotiationMessage } from "@/server/supplier";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ reqId: string }> }) {
  return handle(async () => {
    const { reqId } = await ctx.params;
    const body = (await req.json()) as { text?: string };
    if (!body.text?.trim()) return json({ error: "A message is required" }, 400);
    await sendNegotiationMessage(decodeURIComponent(reqId).toUpperCase(), body.text.trim());
    return json({ ok: true });
  });
}

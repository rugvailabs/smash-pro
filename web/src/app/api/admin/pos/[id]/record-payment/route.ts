import { recordPoPayment } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const body = (await req.json()) as { amount?: number; title?: string };
    if (typeof body.amount !== "number") return json({ error: "Missing field: amount" }, 400);
    await recordPoPayment(decodeURIComponent(id).toUpperCase(), body.amount, body.title);
    return json({ ok: true });
  });
}

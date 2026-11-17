import { confirmReceipt } from "@/server/buyer";
import { handle, json } from "@/server/http";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    await confirmReceipt(decodeURIComponent(id).toUpperCase());
    return json({ ok: true });
  });
}

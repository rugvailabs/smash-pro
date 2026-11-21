import { markInvoiceSent } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    await markInvoiceSent(decodeURIComponent(id).toUpperCase());
    return json({ ok: true });
  });
}

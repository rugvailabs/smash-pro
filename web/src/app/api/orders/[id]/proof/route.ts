import { submitPaymentProof } from "@/server/buyer";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const body = (await req.json()) as { filename?: string; declaredAmount?: unknown };
    if (!body.filename) return json({ error: "filename is required" }, 400);
    if (body.declaredAmount !== undefined && typeof body.declaredAmount !== "number") {
      return json({ error: "declaredAmount must be a number" }, 400);
    }
    await submitPaymentProof(decodeURIComponent(id).toUpperCase(), body.filename, body.declaredAmount as number | undefined);
    return json({ ok: true });
  });
}

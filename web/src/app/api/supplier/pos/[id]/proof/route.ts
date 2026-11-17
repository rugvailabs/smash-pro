import { uploadDeliveryProof } from "@/server/supplier";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const body = (await req.json()) as { filename?: string };
    if (!body.filename) return json({ error: "filename is required" }, 400);
    await uploadDeliveryProof(decodeURIComponent(id).toUpperCase(), body.filename);
    return json({ ok: true });
  });
}

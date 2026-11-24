import { updateServiceRequest } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const body = (await req.json()) as { status?: string; quoted?: number; adminNote?: string };
    await updateServiceRequest(decodeURIComponent(id), body);
    return json({ ok: true });
  });
}

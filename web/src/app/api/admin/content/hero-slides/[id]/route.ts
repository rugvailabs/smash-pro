import { deleteHeroSlide } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    await deleteHeroSlide(decodeURIComponent(id));
    return json({ ok: true });
  });
}

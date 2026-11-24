import { setCategoryHero } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await ctx.params;
    const body = (await req.json()) as { img?: string };
    if (typeof body.img !== "string") return json({ error: "Missing field: img" }, 400);
    await setCategoryHero(decodeURIComponent(slug), body.img);
    return json({ ok: true });
  });
}

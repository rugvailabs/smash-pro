import { setCategoryIntro } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await ctx.params;
    const body = (await req.json()) as { body?: string };
    if (typeof body.body !== "string") return json({ error: "Missing field: body" }, 400);
    await setCategoryIntro(decodeURIComponent(slug), body.body);
    return json({ ok: true });
  });
}

import { createComplaint } from "@/server/buyer";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const body = (await req.json()) as { body?: string };
    if (!body.body?.trim()) return json({ error: "A description is required" }, 400);
    await createComplaint(decodeURIComponent(id).toUpperCase(), body.body.trim());
    return json({ ok: true });
  });
}

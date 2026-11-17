import { suspendOrganization } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const orgId = Number(id);
    if (!Number.isInteger(orgId)) return json({ error: "Invalid organization id" }, 400);
    const body = (await req.json().catch(() => ({}))) as { reason?: string };
    if (!body.reason || typeof body.reason !== "string") {
      return json({ error: "A suspension reason is required" }, 400);
    }
    await suspendOrganization(orgId, body.reason);
    return json({ ok: true });
  });
}

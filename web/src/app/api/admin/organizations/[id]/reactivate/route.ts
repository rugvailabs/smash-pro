import { reactivateOrganization } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const orgId = Number(id);
    if (!Number.isInteger(orgId)) return json({ error: "Invalid organization id" }, 400);
    await reactivateOrganization(orgId);
    return json({ ok: true });
  });
}

import { deletePriceRule } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const ruleId = Number(id);
    if (!Number.isInteger(ruleId) || ruleId <= 0) return json({ error: "Invalid rule id" }, 400);
    await deletePriceRule(ruleId);
    return json({ ok: true });
  });
}

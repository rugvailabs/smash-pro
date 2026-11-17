import { resolveComplaint } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const complaintId = Number(id);
    if (!Number.isInteger(complaintId) || complaintId <= 0) {
      return json({ error: "Invalid complaint id" }, 400);
    }
    await resolveComplaint(complaintId);
    return json({ ok: true });
  });
}

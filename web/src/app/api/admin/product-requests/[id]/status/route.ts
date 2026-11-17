import { setProductRequestStatus } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const body = (await req.json()) as { status?: string; declineReason?: string };
    if (body.status !== "available" && body.status !== "declined") {
      return json({ error: "status must be available or declined" }, 400);
    }
    await setProductRequestStatus(
      decodeURIComponent(id).toUpperCase(), body.status, body.declineReason
    );
    return json({ ok: true });
  });
}

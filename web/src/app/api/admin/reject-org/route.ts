import { rejectOrganization } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { orgId?: number; reason?: string };
    if (!body.orgId) return json({ error: "orgId is required" }, 400);
    if (!body.reason?.trim()) return json({ error: "A rejection reason is required" }, 400);
    await rejectOrganization(body.orgId, body.reason);
    return json({ ok: true });
  });
}

import { setDirectShipment } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { orgId?: number; approved?: boolean };
    if (!body.orgId) return json({ error: "orgId is required" }, 400);
    if (typeof body.approved !== "boolean") return json({ error: "approved must be true or false" }, 400);
    await setDirectShipment(body.orgId, body.approved);
    return json({ ok: true });
  });
}

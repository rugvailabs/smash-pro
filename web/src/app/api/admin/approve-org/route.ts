import { approveOrganization } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { orgId?: number; approvedCategories?: string[] };
    if (!body.orgId) return json({ error: "orgId is required" }, 400);
    if (body.approvedCategories !== undefined &&
        (!Array.isArray(body.approvedCategories) || body.approvedCategories.some((c) => typeof c !== "string"))) {
      return json({ error: "approvedCategories must be a list of category slugs" }, 400);
    }
    await approveOrganization(body.orgId, body.approvedCategories);
    return json({ ok: true });
  });
}

import { requestSensitiveChange } from "@/server/buyer";
import { handle, json } from "@/server/http";

/* POST /api/account/change-request — sensitive fields (legal name / GSTIN)
   do NOT change the org; the request is recorded and routed to Smash Pro
   re-review (DECIDED rule) via an admin notification + audit entry. */

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { field?: string; newValue?: string; note?: string };
    if (body.field !== "legalName" && body.field !== "gstin") {
      return json({ error: "Choose a field to change" }, 400);
    }
    await requestSensitiveChange({
      field: body.field,
      newValue: body.newValue ?? "",
      note: body.note,
    });
    return json({ ok: true });
  });
}

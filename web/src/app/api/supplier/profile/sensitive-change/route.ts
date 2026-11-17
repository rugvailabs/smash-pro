import { requestSensitiveChange } from "@/server/supplier";
import { handle, json } from "@/server/http";

/** POST /api/supplier/profile/sensitive-change — legal name / GSTIN / bank.
 *  Recorded + routed to admin re-review; does NOT change the org. */
export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { field?: string; newValue?: string; note?: string };
    if (!body.field) return json({ error: "A field is required" }, 400);
    if (!body.newValue?.trim()) return json({ error: "A new value is required" }, 400);
    await requestSensitiveChange({ field: body.field, newValue: body.newValue, note: body.note });
    return json({ ok: true });
  });
}

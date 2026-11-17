import { updateContactDetails } from "@/server/buyer";
import { handle, json } from "@/server/http";

/* PATCH /api/account/contact — non-sensitive fields (contact name / phone)
   apply immediately to the buyer's organization. */

export async function PATCH(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { contactName?: string; contactPhone?: string };
    await updateContactDetails({
      contactName: body.contactName ?? "",
      contactPhone: body.contactPhone ?? "",
    });
    return json({ ok: true });
  });
}

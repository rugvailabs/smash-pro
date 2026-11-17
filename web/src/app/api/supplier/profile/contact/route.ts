import { updateSupplierContact } from "@/server/supplier";
import { handle, json } from "@/server/http";

/** POST /api/supplier/profile/contact — applies directly (contact name /
 *  phone are not sensitive fields). */
export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { contactName?: string; contactPhone?: string };
    if (!body.contactName?.trim()) return json({ error: "Contact name is required" }, 400);
    await updateSupplierContact({
      contactName: body.contactName, contactPhone: body.contactPhone ?? "",
    });
    return json({ ok: true });
  });
}

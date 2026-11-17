import { addAddress } from "@/server/buyer";
import { handle, json } from "@/server/http";

/* POST /api/addresses — create a delivery address for the buyer's org.
   Validation (non-empty, length-bounded) and org-scoping live in the service. */

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { label?: string; detail?: string; isDefault?: boolean };
    const out = await addAddress({
      label: body.label ?? "",
      detail: body.detail ?? "",
      isDefault: body.isDefault === true,
    });
    return json(out, 201);
  });
}

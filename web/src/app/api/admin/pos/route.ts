import { createPo } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      quotationId?: number; destination?: string; sku?: string | null; itemSkus?: (string | null)[];
    };
    if (!Number.isInteger(body.quotationId) || (body.quotationId as number) <= 0) {
      return json({ error: "quotationId is required" }, 400);
    }
    if (!body.destination) return json({ error: "Missing field: destination" }, 400);
    const out = await createPo({
      quotationId: body.quotationId!, destination: body.destination, sku: body.sku || null,
      itemSkus: body.itemSkus,
    });
    return json(out);
  });
}

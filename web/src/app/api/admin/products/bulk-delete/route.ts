import { deleteProducts } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { skus?: string[] };
    if (!Array.isArray(body.skus)) return json({ error: "skus must be a list of SKUs" }, 400);
    const out = await deleteProducts(body.skus);
    return json(out);
  });
}

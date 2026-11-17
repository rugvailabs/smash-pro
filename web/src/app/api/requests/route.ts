import { createRequest } from "@/server/buyer";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      title?: string; category?: string; qty?: number; neededBy?: string; spec?: string;
    };
    if (!body.title?.trim() || !body.category || !body.qty || body.qty < 1) {
      return json({ error: "Product, category and quantity are required" }, 400);
    }
    const out = await createRequest({
      title: body.title.trim(), category: body.category, qty: body.qty,
      neededBy: body.neededBy?.trim() || undefined, spec: body.spec?.trim() || undefined,
    });
    return json(out);
  });
}

import { createProduct } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      sku?: string; name?: string; catSlug?: string; sub?: string;
      meta?: string; std?: number; specs?: [string, string][];
    };
    for (const k of ["sku", "name", "catSlug", "sub"] as const) {
      if (!body[k]) return json({ error: `Missing field: ${k}` }, 400);
    }
    if (typeof body.std !== "number") return json({ error: "Missing field: std" }, 400);
    const out = await createProduct({
      sku: body.sku!, name: body.name!, catSlug: body.catSlug!, sub: body.sub!,
      meta: body.meta, std: body.std, specs: body.specs,
    });
    return json(out);
  });
}

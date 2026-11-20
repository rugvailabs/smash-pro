import { createBrand } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { name?: string; notes?: string };
    if (!body.name) return json({ error: "Missing field: name" }, 400);
    const out = await createBrand({ name: body.name, notes: body.notes });
    return json(out);
  });
}

import { createRequirement } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      items?: { title?: string; catSlug?: string; qty?: string }[];
      destination?: string; closes?: string;
      requiredBy?: string; spec?: [string, string][]; fromProductRequestId?: string;
    };
    for (const k of ["destination", "closes"] as const) {
      if (!body[k]) return json({ error: `Missing field: ${k}` }, 400);
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return json({ error: "At least one product is required" }, 400);
    }
    for (const it of body.items) {
      if (!it.title || !it.catSlug || !it.qty) {
        return json({ error: "Each product needs a title, category and quantity" }, 400);
      }
    }
    const out = await createRequirement({
      items: body.items.map((it) => ({ title: it.title!, catSlug: it.catSlug!, qty: it.qty! })),
      destination: body.destination!, closes: body.closes!,
      requiredBy: body.requiredBy, spec: body.spec,
      fromProductRequestId: body.fromProductRequestId,
    });
    return json(out);
  });
}

import { createRequirement } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      title?: string; catSlug?: string; qty?: string; destination?: string; closes?: string;
      requiredBy?: string; spec?: [string, string][]; fromProductRequestId?: string;
    };
    for (const k of ["title", "catSlug", "qty", "destination", "closes"] as const) {
      if (!body[k]) return json({ error: `Missing field: ${k}` }, 400);
    }
    const out = await createRequirement({
      title: body.title!, catSlug: body.catSlug!, qty: body.qty!,
      destination: body.destination!, closes: body.closes!,
      requiredBy: body.requiredBy, spec: body.spec,
      fromProductRequestId: body.fromProductRequestId,
    });
    return json(out);
  });
}

import { upsertHeroSlide } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      id?: string; img?: string; imgPosition?: string; eyebrow?: string; titleA?: string;
      accent?: string; titleB?: string; body?: string; ctaLabel?: string; ctaHref?: string;
      institutional?: boolean; active?: boolean; sortOrder?: number;
    };
    for (const k of ["img", "eyebrow", "titleA", "accent", "titleB", "body", "ctaLabel", "ctaHref"] as const) {
      if (!body[k]) return json({ error: `Missing field: ${k}` }, 400);
    }
    const out = await upsertHeroSlide({
      id: body.id,
      img: body.img!, imgPosition: body.imgPosition, eyebrow: body.eyebrow!, titleA: body.titleA!,
      accent: body.accent!, titleB: body.titleB!, body: body.body!, ctaLabel: body.ctaLabel!, ctaHref: body.ctaHref!,
      institutional: body.institutional, active: body.active, sortOrder: body.sortOrder,
    });
    return json({ ok: true, ...out });
  });
}

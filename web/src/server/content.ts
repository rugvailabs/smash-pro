import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";

/* ============================================================
   Public reads for admin-editable site content (ADR-0021) — homepage
   hero slides and per-category banner image/intro text. No auth:
   these back public pages. Admin CRUD lives in server/admin.ts
   alongside every other admin-only mutation.
   ============================================================ */

export interface HeroSlideDto {
  id: string;
  img: string;
  pos: string;
  eyebrow: string;
  titleA: string;
  accent: string;
  titleB: string;
  text: string;
  cta: { label: string; href: string };
  institutional: boolean;
}

export async function getHeroSlides(): Promise<HeroSlideDto[]> {
  const rows = await db
    .select()
    .from(schema.siteContent)
    .where(and(eq(schema.siteContent.section, "hero-slide"), eq(schema.siteContent.active, true)))
    .orderBy(asc(schema.siteContent.sortOrder));
  return rows.map((r) => ({
    id: r.id,
    img: r.img ?? "",
    pos: r.imgPosition ?? "center",
    eyebrow: r.eyebrow ?? "",
    titleA: r.titleA ?? "",
    accent: r.accent ?? "",
    titleB: r.titleB ?? "",
    text: r.body ?? "",
    cta: { label: r.ctaLabel ?? "Explore", href: r.ctaHref ?? "/catalog?cat=cricket" },
    institutional: r.institutional,
  }));
}

export async function getCategoryHeroMap(): Promise<Record<string, string | null>> {
  const rows = await db
    .select({ catSlug: schema.siteContent.catSlug, img: schema.siteContent.img })
    .from(schema.siteContent)
    .where(eq(schema.siteContent.section, "category-hero"));
  const map: Record<string, string | null> = {};
  for (const r of rows) if (r.catSlug) map[r.catSlug] = r.img || null;
  return map;
}

export async function getCategoryIntroMap(): Promise<Record<string, string>> {
  const rows = await db
    .select({ catSlug: schema.siteContent.catSlug, body: schema.siteContent.body })
    .from(schema.siteContent)
    .where(eq(schema.siteContent.section, "category-intro"));
  const map: Record<string, string> = {};
  for (const r of rows) if (r.catSlug && r.body) map[r.catSlug] = r.body;
  return map;
}

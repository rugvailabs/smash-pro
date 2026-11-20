import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";

/* ============================================================
   Approved-photography library browser (admin-only). Lists files
   already committed under public/img/<catSlug>/ by the photography
   programme — never writes, never accepts an upload (ADR-0005: no
   file-storage backend exists). catSlug is checked against the real
   categories table before touching the filesystem, so this can never
   be used to read outside the approved imagery tree.
   ============================================================ */

const IMG_EXT = /\.(jpe?g|png|webp)$/i;

export async function listCatalogueImages(catSlug: string): Promise<string[]> {
  await requireAdmin();

  const [cat] = await db
    .select({ slug: schema.categories.slug })
    .from(schema.categories)
    .where(eq(schema.categories.slug, catSlug));
  if (!cat) throw new Error("400:Unknown category");

  const dir = path.join(process.cwd(), "public", "img", cat.slug);
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return []; // no photography folder for this category yet
  }
  return files
    .filter((f) => IMG_EXT.test(f))
    .sort((a, b) => a.localeCompare(b))
    .map((f) => `/img/${cat.slug}/${f}`);
}

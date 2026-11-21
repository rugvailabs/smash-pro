import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { uploadProductImage } from "@/server/storage";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();

    const form = await req.formData();
    const file = form.get("file");
    const catSlug = form.get("catSlug");
    if (!(file instanceof File)) return json({ error: "Missing field: file" }, 400);
    if (typeof catSlug !== "string" || !catSlug) return json({ error: "Missing field: catSlug" }, 400);

    const [cat] = await db
      .select({ slug: schema.categories.slug })
      .from(schema.categories)
      .where(eq(schema.categories.slug, catSlug));
    if (!cat) return json({ error: "Unknown category" }, 400);

    const bytes = Buffer.from(await file.arrayBuffer());
    const out = await uploadProductImage({
      catSlug: cat.slug, filename: file.name, contentType: file.type, bytes,
    });
    return json(out);
  });
}

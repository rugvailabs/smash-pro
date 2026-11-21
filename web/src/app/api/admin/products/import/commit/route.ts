import { bulkImportProducts, type ImportCommitRow } from "@/server/admin";
import { handle, json } from "@/server/http";
import type { PriceMode } from "@/lib/pricing-calc";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      rows?: ImportCommitRow[];
      catSlug?: string;
      sub?: string;
      brandId?: number | null;
      marginMode?: PriceMode;
      marginValue?: number;
      activate?: boolean;
    };
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return json({ error: "No rows to import" }, 400);
    }
    if (!body.catSlug) return json({ error: "Missing field: catSlug" }, 400);
    // sub/marginMode/marginValue are optional — bulkImportProducts applies
    // safe defaults ("Imported" / 0% margin) when left blank, since one
    // batch rarely has a single correct subcategory or margin.
    const out = await bulkImportProducts({
      rows: body.rows,
      catSlug: body.catSlug,
      sub: body.sub,
      brandId: body.brandId ?? null,
      marginMode: body.marginMode,
      marginValue: body.marginValue,
      activate: body.activate ?? false,
    });
    return json(out);
  });
}

import { previewImport } from "@/server/excel-import";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const form = await req.formData();
    const file = form.get("file");
    const skuPrefix = form.get("skuPrefix");
    const mappingRaw = form.get("mapping");
    if (!(file instanceof File)) return json({ error: "A file is required" }, 400);
    if (typeof skuPrefix !== "string" || !skuPrefix) return json({ error: "A SKU prefix is required" }, 400);
    let mapping: unknown;
    if (typeof mappingRaw === "string" && mappingRaw) {
      try { mapping = JSON.parse(mappingRaw); } catch { return json({ error: "Malformed column mapping" }, 400); }
    }
    const buffer = await file.arrayBuffer();
    const preview = await previewImport(buffer, skuPrefix, mapping);
    return json(preview);
  });
}

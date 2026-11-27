import { getImportColumns } from "@/server/excel-import";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "A file is required" }, 400);
    const buffer = await file.arrayBuffer();
    const result = await getImportColumns(buffer);
    return json(result);
  });
}

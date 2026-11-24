import { requireAdmin } from "@/server/auth";
import { uploadSiteImage } from "@/server/storage";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();

    const form = await req.formData();
    const file = form.get("file");
    const folder = form.get("folder");
    if (!(file instanceof File)) return json({ error: "Missing field: file" }, 400);

    const bytes = Buffer.from(await file.arrayBuffer());
    const out = await uploadSiteImage({
      folder: typeof folder === "string" && folder ? folder : "general",
      filename: file.name, contentType: file.type, bytes,
    });
    return json(out);
  });
}

import { listCatalogueImages } from "@/server/media";
import { handle, json } from "@/server/http";

export async function GET(req: Request) {
  return handle(async () => {
    const cat = new URL(req.url).searchParams.get("cat");
    if (!cat) return json({ error: "Missing query param: cat" }, 400);
    const images = await listCatalogueImages(cat);
    return json({ images });
  });
}

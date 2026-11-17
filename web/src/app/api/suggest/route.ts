import { suggestFor } from "@/server/catalog";
import { handle, json } from "@/server/http";

export async function GET(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams.get("q") ?? "";
    return json(await suggestFor(q));
  });
}

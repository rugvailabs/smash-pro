import { requestCategoryChange } from "@/server/supplier";
import { handle, json } from "@/server/http";

/** POST /api/supplier/profile/category-change — recorded + routed to admin
 *  re-review; does NOT change approved categories. */
export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { categories?: string[]; note?: string };
    if (!Array.isArray(body.categories) || body.categories.length === 0) {
      return json({ error: "Select at least one category" }, 400);
    }
    await requestCategoryChange({ categories: body.categories, note: body.note });
    return json({ ok: true });
  });
}

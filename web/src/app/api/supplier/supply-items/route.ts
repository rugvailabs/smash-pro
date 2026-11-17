import { addSupplyItem } from "@/server/supplier";
import { handle, json } from "@/server/http";

/** POST /api/supplier/supply-items — add a catalogue item (org-scoped). */
export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as {
      name?: string; category?: string; capacity?: string; lead?: string; cost?: number;
    };
    if (!body.name?.trim()) return json({ error: "Item name is required" }, 400);
    if (!body.category?.trim()) return json({ error: "Category is required" }, 400);
    if (typeof body.cost !== "number" || !Number.isFinite(body.cost) || body.cost <= 0) {
      return json({ error: "Cost must be a positive amount in rupees" }, 400);
    }
    const out = await addSupplyItem({
      name: body.name, category: body.category,
      capacity: body.capacity ?? "", lead: body.lead ?? "", cost: body.cost,
    });
    return json(out);
  });
}

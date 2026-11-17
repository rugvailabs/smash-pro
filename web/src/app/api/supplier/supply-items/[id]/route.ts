import { setSupplyItemAvailability, updateSupplyItem } from "@/server/supplier";
import { handle, json } from "@/server/http";

/** PATCH /api/supplier/supply-items/[id] — update item fields, OR flip
 *  availability when the body is { available: boolean }. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const itemId = Number(id);
    if (!Number.isInteger(itemId) || itemId <= 0) return json({ error: "Invalid item id" }, 400);
    const body = (await req.json()) as {
      available?: boolean; name?: string; category?: string;
      capacity?: string; lead?: string; cost?: number;
    };
    if (typeof body.available === "boolean" && Object.keys(body).length === 1) {
      await setSupplyItemAvailability(itemId, body.available);
      return json({ ok: true });
    }
    await updateSupplyItem(itemId, {
      name: body.name, category: body.category,
      capacity: body.capacity, lead: body.lead, cost: body.cost,
    });
    return json({ ok: true });
  });
}

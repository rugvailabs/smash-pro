import {
  addCartLine, cartForSession, clearCart, removeCartLine, setCartQty,
} from "@/server/buyer";
import { handle, json } from "@/server/http";
import type { RacquetConfig } from "@/lib/types";

export async function GET() {
  return handle(async () => {
    const cart = await cartForSession();
    // visitors/pending/suppliers have no server cart — empty shape, no 401
    // (the UI gates ordering; this endpoint leaks nothing)
    return json(cart ?? { lines: [], count: 0, itemsIncl: 0, subtotalExGst: 0, gst: 0, shipping: 0, total: 0, freeDeliveryEligible: false });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { sku?: string; qty?: number; config?: RacquetConfig; delta?: unknown };
    if (!body.sku || typeof body.qty !== "number") return json({ error: "sku and qty are required" }, 400);
    // price adjustments are computed server-side only — a client sending one
    // is malformed at best and malicious at worst: reject outright
    if (body.delta !== undefined) return json({ error: "Price adjustments are not accepted" }, 400);
    await addCartLine(body.sku, body.qty, body.config);
    return json(await cartForSession());
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { key?: string; qty?: number };
    if (!body.key || typeof body.qty !== "number") return json({ error: "key and qty are required" }, 400);
    await setCartQty(body.key, body.qty);
    return json(await cartForSession());
  });
}

export async function DELETE(req: Request) {
  return handle(async () => {
    const body = (await req.json().catch(() => ({}))) as { key?: string; all?: boolean };
    if (body.all) await clearCart();
    else if (body.key) await removeCartLine(body.key);
    else return json({ error: "key or all is required" }, 400);
    return json(await cartForSession());
  });
}

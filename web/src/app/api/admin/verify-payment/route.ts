import { verifyPayment } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const { orderId } = (await req.json()) as { orderId?: string };
    if (!orderId) return json({ error: "orderId is required" }, 400);
    await verifyPayment(orderId.toUpperCase());
    return json({ ok: true });
  });
}

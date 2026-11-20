import { createOrderFromCart } from "@/server/buyer";
import { handle, json } from "@/server/http";

const PAYMENT_METHODS = ["UPI", "Card", "Net Banking", "NEFT", "RTGS", "Cheque"];
const DELIVERY_METHODS = ["managed", "self-pickup", "self-courier"];

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { shipTo?: string; method?: string; deliveryMethod?: string };
    if (!body.shipTo || !body.method || !body.deliveryMethod) {
      return json({ error: "shipTo, method and deliveryMethod are required" }, 400);
    }
    if (!PAYMENT_METHODS.includes(body.method)) return json({ error: "Unknown payment method" }, 400);
    if (!DELIVERY_METHODS.includes(body.deliveryMethod)) return json({ error: "Unknown delivery method" }, 400);
    const out = await createOrderFromCart({
      shipTo: body.shipTo,
      method: body.method as "UPI" | "Card" | "Net Banking" | "NEFT" | "RTGS" | "Cheque",
      deliveryMethod: body.deliveryMethod as "managed" | "self-pickup" | "self-courier",
    });
    return json(out);
  });
}

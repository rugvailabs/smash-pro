import { createOrderFromCart } from "@/server/buyer";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { shipTo?: string; method?: string };
    if (!body.shipTo || !body.method) return json({ error: "shipTo and method are required" }, 400);
    const methods = ["UPI", "Card", "Net Banking", "NEFT", "RTGS", "Cheque"];
    if (!methods.includes(body.method)) return json({ error: "Unknown payment method" }, 400);
    const out = await createOrderFromCart({
      shipTo: body.shipTo,
      method: body.method as "UPI" | "Card" | "Net Banking" | "NEFT" | "RTGS" | "Cheque",
    });
    return json(out);
  });
}

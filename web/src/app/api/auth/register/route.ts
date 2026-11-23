import { registerOrganization, type RegistrationInput } from "@/server/registration";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as Partial<RegistrationInput>;
    if (body.kind !== "buyer" && body.kind !== "supplier") {
      return json({ error: "kind must be buyer or supplier" }, 400);
    }
    const isVisitor = body.kind === "buyer" && body.visitor === true;
    // visitor signup is intentionally minimal — no institution name/type/GSTIN required
    const required = isVisitor
      ? (["kind", "contactName", "email", "password"] as const)
      : (["kind", "orgName", "legalName", "orgType", "contactName", "email", "password"] as const);
    for (const k of required) {
      if (!body[k]) return json({ error: `Missing field: ${k}` }, 400);
    }
    if ((body.password as string).length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }
    if (isVisitor) {
      body.orgName = body.orgName || body.contactName!;
      body.legalName = body.legalName || body.orgName;
      body.orgType = body.orgType || "Individual";
      body.gstin = body.gstin || "";
      body.city = body.city || "";
      body.buyerCategory = body.buyerCategory || "Visitor";
    }
    const out = await registerOrganization(body as RegistrationInput);
    return json({ ok: true, ...out });
  });
}

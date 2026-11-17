import { registerOrganization, type RegistrationInput } from "@/server/registration";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as Partial<RegistrationInput>;
    for (const k of ["kind", "orgName", "legalName", "orgType", "contactName", "email", "password"] as const) {
      if (!body[k]) return json({ error: `Missing field: ${k}` }, 400);
    }
    if (body.kind !== "buyer" && body.kind !== "supplier") {
      return json({ error: "kind must be buyer or supplier" }, 400);
    }
    if ((body.password as string).length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }
    const out = await registerOrganization(body as RegistrationInput);
    return json({ ok: true, ...out });
  });
}

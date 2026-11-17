import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { createSession, destroySession } from "@/server/auth";
import { handle, json } from "@/server/http";

/** Demo-account switcher (preview ribbon). Enabled only when DEMO_MODE=1 —
 *  it performs REAL sign-ins against the seeded accounts, so every role
 *  boundary is exercised with genuine sessions. */
const DEMO_ACCOUNTS: Record<string, string | null> = {
  visitor: null,
  buyer: "buyer@demo.prosmash.in",
  supplier: "supplier@demo.prosmash.in",
  pending: "pending@demo.prosmash.in",
  admin: "admin@demo.prosmash.in",
};

export async function POST(req: Request) {
  return handle(async () => {
    if (process.env.DEMO_MODE !== "1") return json({ error: "Demo mode is disabled" }, 403);
    const { as } = (await req.json()) as { as?: string };
    if (as === undefined || !(as in DEMO_ACCOUNTS)) return json({ error: "Unknown demo account" }, 400);
    await destroySession();
    const email = DEMO_ACCOUNTS[as];
    if (email === null) return json({ ok: true, role: "visitor" });
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    if (!user) return json({ error: "Demo data not seeded yet" }, 409);
    await createSession(user.id);
    return json({ ok: true });
  });
}

import { createSession, verifyCredentials } from "@/server/auth";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) return json({ error: "Email and password are required" }, 400);
    const user = await verifyCredentials(email, password);
    if (!user) return json({ error: "Email or password is incorrect" }, 401);
    await createSession(user.id);
    return json({ ok: true });
  });
}

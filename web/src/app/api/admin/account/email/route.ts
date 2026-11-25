import { updateOwnAdminEmail } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { currentPassword?: string; newEmail?: string };
    if (!body.currentPassword) return json({ error: "Enter your current password" }, 400);
    if (!body.newEmail) return json({ error: "Enter a new email address" }, 400);
    await updateOwnAdminEmail({ currentPassword: body.currentPassword, newEmail: body.newEmail });
    return json({ ok: true });
  });
}

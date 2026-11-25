import { updateOwnAdminPassword } from "@/server/admin";
import { handle, json } from "@/server/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { currentPassword?: string; newPassword?: string };
    if (!body.currentPassword) return json({ error: "Enter your current password" }, 400);
    if (!body.newPassword) return json({ error: "Enter a new password" }, 400);
    await updateOwnAdminPassword({ currentPassword: body.currentPassword, newPassword: body.newPassword });
    return json({ ok: true });
  });
}

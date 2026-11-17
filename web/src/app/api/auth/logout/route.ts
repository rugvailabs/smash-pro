import { destroySession } from "@/server/auth";
import { handle, json } from "@/server/http";

export async function POST() {
  return handle(async () => {
    await destroySession();
    return json({ ok: true });
  });
}

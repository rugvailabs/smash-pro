import { markAllReadForSession, markOneReadForSession } from "@/server/notifications";
import { handle, json } from "@/server/http";

/** Mark all notifications read, or one when {id} is provided. */
export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json().catch(() => ({}))) as { id?: number };
    if (typeof body.id === "number") await markOneReadForSession(body.id);
    else await markAllReadForSession();
    return json({ ok: true });
  });
}

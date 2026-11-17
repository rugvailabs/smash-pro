import { notificationsForSession, unreadCountForSession } from "@/server/notifications";
import { handle, json } from "@/server/http";

/** The signed-in user's notification feed + unread count (in-app only). */
export async function GET() {
  return handle(async () => {
    const [items, unread] = await Promise.all([notificationsForSession(), unreadCountForSession()]);
    return json({ items, unread });
  });
}

import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getSession } from "@/server/auth";

/* ============================================================
   In-app notifications (PHASE 2). OBD-13 note: external channels
   (email / SMS / push) are PENDING — this is an in-app feed only,
   never an external send. Append-only rows per user.
   ============================================================ */

export interface NotificationDto {
  id: number;
  body: string;
  href: string | null;
  read: boolean;
  /** relative-ish display time, e.g. "2 Dec 2026, 14:03" */
  at: string;
}

const fmt = (d: Date) =>
  d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Append a notification for one user. Safe to call from any mutation;
 *  never throws on a bad/absent user — notifications must not break a
 *  primary workflow. Pass the RECIPIENT's users.id (not org id). */
export async function notify(userId: number | null | undefined, body: string, href?: string): Promise<void> {
  if (!userId) return;
  try {
    await db.insert(schema.notifications).values({ userId, body, href: href ?? null });
  } catch {
    /* notifications are best-effort — swallow to protect the main workflow */
  }
}

/** Notify every user belonging to an organization (one-user orgs today,
 *  OBD-15; written to fan out cleanly if multi-user lands later). */
export async function notifyOrg(orgId: number | null | undefined, body: string, href?: string): Promise<void> {
  if (!orgId) return;
  const users = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.orgId, orgId));
  for (const u of users) await notify(u.id, body, href);
}

/** Notify all admin users (platform operations). */
export async function notifyAdmins(body: string, href?: string): Promise<void> {
  const admins = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "admin"));
  for (const a of admins) await notify(a.id, body, href);
}

/* ---------- session-scoped read side ---------- */

export async function notificationsForSession(limit = 30): Promise<NotificationDto[]> {
  const s = await getSession();
  if (!s) return [];
  const rows = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, s.userId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit);
  return rows.map((n) => ({ id: n.id, body: n.body, href: n.href, read: n.readAt !== null, at: fmt(n.createdAt) }));
}

export async function unreadCountForSession(): Promise<number> {
  const s = await getSession();
  if (!s) return 0;
  const rows = await db
    .select({ id: schema.notifications.id })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, s.userId), isNull(schema.notifications.readAt)));
  return rows.length;
}

export async function markAllReadForSession(): Promise<void> {
  const s = await getSession();
  if (!s) throw new Error("401");
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.userId, s.userId), isNull(schema.notifications.readAt)));
}

export async function markOneReadForSession(id: number): Promise<void> {
  const s = await getSession();
  if (!s) throw new Error("401");
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, s.userId)));
}

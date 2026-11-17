import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db, schema } from "@/server/db";

/* ============================================================
   First-party credential auth (ADR-0004): bcrypt passwords,
   database-backed sessions, HTTP-only cookie. Role and org are
   resolved server-side on every request — PLT-001 enforcement
   lives here, not in the client.
   ============================================================ */

const COOKIE = "ps_session";
const SESSION_DAYS = 7;

export interface SessionUser {
  userId: number;
  role: "buyer" | "supplier" | "admin";
  orgId: number | null;
  orgStatus: string | null;
  orgName: string | null;
  email: string;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(schema.sessions).values({ token, userId, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
    jar.delete(COOKIE);
  }
}

export async function verifyCredentials(email: string, password: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase().trim()));
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

/** The session, or null. Never trusts client state. */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      userId: schema.users.id,
      role: schema.users.role,
      email: schema.users.email,
      orgId: schema.users.orgId,
      orgStatus: schema.organizations.status,
      orgName: schema.organizations.name,
      expiresAt: schema.sessions.expiresAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .leftJoin(schema.organizations, eq(schema.users.orgId, schema.organizations.id))
    .where(eq(schema.sessions.token, token));
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
    return null;
  }
  return {
    userId: row.userId,
    role: row.role as SessionUser["role"],
    orgId: row.orgId,
    orgStatus: row.orgStatus,
    orgName: row.orgName,
    email: row.email,
  };
}

/** Approved-role guards — the server-side PLT-001 boundary. */
export async function requireApproved(role: "buyer" | "supplier"): Promise<SessionUser> {
  const s = await getSession();
  if (!s || s.role !== role || s.orgStatus !== "active") {
    throw new AuthError(s ? 403 : 401);
  }
  return s;
}

export async function requireAdmin(): Promise<SessionUser> {
  const s = await getSession();
  if (!s || s.role !== "admin") throw new AuthError(s ? 403 : 401);
  return s;
}

export class AuthError extends Error {
  constructor(public status: 401 | 403) {
    super(status === 401 ? "Not signed in" : "Not permitted");
  }
}

export async function audit(
  actorUserId: number | null,
  action: string,
  entity: string,
  entityId: string,
  detail?: unknown
) {
  await db.insert(schema.auditLog).values({
    actorUserId,
    action,
    entity,
    entityId,
    detail: detail ?? null,
  });
}

import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { audit, createSession, hashPassword } from "@/server/auth";

/* ============================================================
   Registration (Workflows A/H): creates the organization in
   `pending` status + its first user (OBD-15 open: one user per
   org), records document METADATA only (ADR-0005), signs the
   user in, and leaves approval to the admin side (ADM-001/002).
   OBD-02 verification workflow stays ◇ — no review checklists.

   Exception — visitor buyers (ADR-0011, owner-directed 2026-11-23):
   a lightweight buyer registration that skips the approval queue
   entirely, landing straight in `active` status so they can order
   immediately. This is a deliberate carve-out from the OBD-03
   clarification ("ordering remains approval-gated") for this one
   registration path only — institutional buyer/supplier
   registration below is unaffected.
   ============================================================ */

export interface RegistrationInput {
  kind: "buyer" | "supplier";
  orgName: string;
  legalName: string;
  orgType: string;
  gstin: string;
  city: string;
  contactName: string;
  contactPhone: string;
  email: string;
  password: string;
  /** buyer only */
  buyerCategory?: string;
  /** supplier only — approved category slugs requested */
  categories?: string[];
  /** document METADATA (filenames) — bytes are not retained (ADR-0005) */
  documents?: string[];
  /** buyer only — skip admin approval, org is created `active` (ADR-0011) */
  visitor?: boolean;
}

export async function registerOrganization(input: RegistrationInput) {
  const email = input.email.toLowerCase().trim();
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing) throw new Error("email-taken");

  const isVisitor = input.kind === "buyer" && input.visitor === true;

  const [org] = await db
    .insert(schema.organizations)
    .values({
      kind: input.kind,
      status: isVisitor ? "active" : "pending",
      name: input.orgName,
      legalName: input.legalName || input.orgName,
      orgType: input.orgType,
      gstin: input.gstin,
      city: input.city,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      email,
      buyerCategory: input.kind === "buyer" ? (input.buyerCategory ?? input.orgType) : null,
      approvedCategories: input.kind === "supplier" ? (input.categories ?? []) : null,
    })
    .returning();

  const [user] = await db
    .insert(schema.users)
    .values({
      orgId: org.id,
      email,
      passwordHash: await hashPassword(input.password),
      name: input.contactName,
      role: input.kind,
    })
    .returning();

  if (input.documents?.length) {
    await db.insert(schema.documents).values(
      input.documents.map((f) => ({ orgId: org.id, filename: f, state: "Submitted" }))
    );
  }

  await audit(user.id, "org.register", "organization", String(org.id), { kind: input.kind, visitor: isVisitor });
  await createSession(user.id);
  return { orgId: org.id, userId: user.id };
}

import "server-only";
import { db, schema } from "@/server/db";
import { getSession, audit } from "@/server/auth";
import { uploadServiceRequestPhoto, uploadServiceRequestVoiceNote } from "@/server/storage";
import { SERVICE_CATALOG, type ServiceKind, type ServiceSport } from "@/lib/service-catalog";

/* ============================================================
   Equipment Care/Repair service booking (ADR-0020) — public submission,
   no account required. A signed-in buyer's org/user is attached
   opportunistically (so it shows on their account later); a visitor's
   own typed contact details are the only requirement either way.
   Pricing stays PENDING CONFIRMATION beyond what the owner already
   decided: quoted manually by admin after inspection, no payment flow.
   ============================================================ */

export interface SubmitServiceRequestInput {
  kind: ServiceKind;
  sport: ServiceSport;
  services: string[];
  equipmentSource: "new" | "own";
  brand?: string;
  model?: string;
  description?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  photos: { filename: string; contentType: string; bytes: Buffer }[];
  voiceNote?: { filename: string; contentType: string; bytes: Buffer };
}

function assertNonEmpty(v: string | undefined, label: string, max = 200): string {
  const t = (v ?? "").trim();
  if (!t) throw new Error(`400:${label} is required`);
  if (t.length > max) throw new Error(`400:${label} is too long`);
  return t;
}

export async function submitServiceRequest(input: SubmitServiceRequestInput): Promise<{ id: string }> {
  if (input.kind !== "care" && input.kind !== "repair") throw new Error("400:Invalid service kind");
  const sportCatalog = SERVICE_CATALOG[input.sport];
  if (!sportCatalog) throw new Error("400:Unknown sport");
  const validSlugs = new Set(sportCatalog[input.kind].map((s) => s.slug));
  const services = [...new Set(input.services)].filter((s) => validSlugs.has(s));
  if (services.length === 0) throw new Error("400:Select at least one service");
  if (input.equipmentSource !== "new" && input.equipmentSource !== "own") {
    throw new Error("400:Invalid equipment source");
  }
  if (input.photos.length === 0) throw new Error("400:At least one photo is required");
  if (input.photos.length > 6) throw new Error("400:Up to 6 photos");

  const contactName = assertNonEmpty(input.contactName, "Name", 120);
  const contactPhone = assertNonEmpty(input.contactPhone, "Phone", 20);
  const contactEmail = input.contactEmail?.trim() || null;
  const description = (input.description ?? "").trim().slice(0, 2000) || null;
  const brand = (input.brand ?? "").trim().slice(0, 120) || null;
  const model = (input.model ?? "").trim().slice(0, 120) || null;

  const photoUrls: string[] = [];
  for (const p of input.photos) {
    const { url } = await uploadServiceRequestPhoto(p);
    photoUrls.push(url);
  }
  let voiceNoteUrl: string | null = null;
  if (input.voiceNote) {
    const { url } = await uploadServiceRequestVoiceNote(input.voiceNote);
    voiceNoteUrl = url;
  }

  const session = await getSession();

  const rows = await db.select({ id: schema.serviceRequests.id }).from(schema.serviceRequests);
  const max = rows.reduce((m, x) => Math.max(m, Number(x.id.slice(-5)) || 0), 0);
  const id = `SR-2026-${String(max + 1).padStart(5, "0")}`;

  await db.insert(schema.serviceRequests).values({
    id,
    orgId: session?.orgId ?? null,
    userId: session?.userId ?? null,
    contactName, contactPhone, contactEmail,
    kind: input.kind, sport: input.sport, services,
    equipmentSource: input.equipmentSource, brand, model, description,
    photos: photoUrls, voiceNoteUrl,
    status: "new", statusLabel: "New",
  });
  await audit(session?.userId ?? null, "service-request.create", "service_request", id, {
    kind: input.kind, sport: input.sport, services,
  });
  return { id };
}

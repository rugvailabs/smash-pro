import { submitServiceRequest } from "@/server/service";
import { handle, json } from "@/server/http";
import type { ServiceKind, ServiceSport } from "@/lib/service-catalog";

/** Public endpoint — no auth. A repair booking is submitted before any
 *  sign-in, same as a support/contact enquiry. */
export async function POST(req: Request) {
  return handle(async () => {
    const form = await req.formData();

    const kind = form.get("kind");
    const sport = form.get("sport");
    const equipmentSource = form.get("equipmentSource");
    const contactName = form.get("contactName");
    const contactPhone = form.get("contactPhone");
    const contactEmail = form.get("contactEmail");
    const brand = form.get("brand");
    const model = form.get("model");
    const description = form.get("description");
    const servicesRaw = form.get("services");

    if (typeof kind !== "string" || typeof sport !== "string") {
      return json({ error: "Missing field: kind or sport" }, 400);
    }
    if (typeof contactName !== "string" || typeof contactPhone !== "string") {
      return json({ error: "Missing field: contactName or contactPhone" }, 400);
    }
    if (typeof servicesRaw !== "string") return json({ error: "Missing field: services" }, 400);
    let services: string[];
    try {
      services = JSON.parse(servicesRaw);
      if (!Array.isArray(services)) throw new Error();
    } catch {
      return json({ error: "Invalid services field" }, 400);
    }

    const photoFiles = form.getAll("photos").filter((f): f is File => f instanceof File);
    const photos = await Promise.all(
      photoFiles.map(async (f) => ({
        filename: f.name, contentType: f.type, bytes: Buffer.from(await f.arrayBuffer()),
      }))
    );

    const voiceFile = form.get("voiceNote");
    const voiceNote = voiceFile instanceof File && voiceFile.size > 0
      ? { filename: voiceFile.name || "voice-note.webm", contentType: voiceFile.type, bytes: Buffer.from(await voiceFile.arrayBuffer()) }
      : undefined;

    const out = await submitServiceRequest({
      kind: kind as ServiceKind,
      sport: sport as ServiceSport,
      services,
      equipmentSource: equipmentSource === "new" ? "new" : "own",
      brand: typeof brand === "string" ? brand : undefined,
      model: typeof model === "string" ? model : undefined,
      description: typeof description === "string" ? description : undefined,
      contactName, contactPhone,
      contactEmail: typeof contactEmail === "string" ? contactEmail : undefined,
      photos, voiceNote,
    });
    return json({ ok: true, ...out });
  });
}

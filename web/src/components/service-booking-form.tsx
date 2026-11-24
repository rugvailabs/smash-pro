"use client";

import { useEffect, useMemo, useState } from "react";
import { useRole } from "@/components/providers";
import { VoiceRecorder } from "@/components/voice-recorder";
import { SERVICE_CATALOG, SERVICE_SPORTS, type ServiceKind, type ServiceSport } from "@/lib/service-catalog";

/* ============================================================
   Equipment Care/Repair booking form (ADR-0020). Public — no account
   required; a signed-in buyer's org/user is attached server-side
   automatically. Photos are MANDATORY (at least one); the voice note
   is optional. Submission uploads everything in one multipart POST
   and returns a Smash Pro reference (SR-YYYY-NNNNN) — pricing is
   deliberately NOT shown here: an admin quotes manually after
   inspecting what's submitted.
   ============================================================ */

const input = "h-11 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-base text-ink placeholder:text-n400 md:text-sm";
const label = "mb-1.5 block text-[13px] font-medium text-ink";
const primary = "inline-flex h-12 items-center justify-center rounded-[2px] bg-ember-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400";
const MAX_PHOTOS = 6;

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "flex-1 rounded-[2px] px-5 py-3 text-center text-sm font-semibold transition-colors " +
        (active ? "bg-ink text-chalk" : "bg-chalk text-n600 hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

function PillRadio({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors " +
        (active ? "border-ember-deep bg-ember-deep text-white" : "border-n400 bg-chalk text-ink hover:border-ink")
      }
    >
      {children}
    </button>
  );
}

export function ServiceBookingForm() {
  const { email } = useRole();

  const [kind, setKind] = useState<ServiceKind>("care");
  const [sport, setSport] = useState<ServiceSport>("cricket");
  const [services, setServices] = useState<string[]>([]);
  const [equipmentSource, setEquipmentSource] = useState<"new" | "own">("own");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const displayEmail = emailTouched ? contactEmail : contactEmail || email || "";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string } | null>(null);

  // switching sport or kind invalidates the previous service selection —
  // reset during render (not an effect) per the "adjusting state when a
  // prop changes" pattern, so it can't cascade an extra render.
  const [lastCatalogKey, setLastCatalogKey] = useState(`${kind}|${sport}`);
  if (lastCatalogKey !== `${kind}|${sport}`) {
    setLastCatalogKey(`${kind}|${sport}`);
    setServices([]);
  }

  const catalog = useMemo(() => SERVICE_CATALOG[sport][kind], [sport, kind]);
  const photoUrls = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => photoUrls.forEach((u) => URL.revokeObjectURL(u)), [photoUrls]);

  const toggleService = (slug: string) =>
    setServices((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setPhotos((prev) => [...prev, ...Array.from(files)].slice(0, MAX_PHOTOS));
  };
  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const canSubmit =
    services.length > 0 && photos.length > 0 &&
    contactName.trim().length > 0 && contactPhone.trim().length > 0 && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("sport", sport);
      form.set("services", JSON.stringify(services));
      form.set("equipmentSource", equipmentSource);
      form.set("brand", brand);
      form.set("model", model);
      form.set("description", description);
      form.set("contactName", contactName.trim());
      form.set("contactPhone", contactPhone.trim());
      form.set("contactEmail", displayEmail.trim());
      photos.forEach((f) => form.append("photos", f));
      if (voiceBlob) form.set("voiceNote", voiceBlob, "voice-note.webm");

      const res = await fetch("/api/service-requests", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !data.ok || !data.id) {
        setError(data.error ?? "Something went wrong submitting your request — please try again.");
        return;
      }
      setResult({ id: data.id });
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-[4px] border border-n200 bg-chalk p-8 text-center shadow-overlay">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ok-t text-ok">
          <svg viewBox="0 0 24 24" aria-hidden className="h-7 w-7 fill-none stroke-current" strokeWidth="2.2"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 className="font-display text-xl font-bold text-ink">Request submitted</h2>
        <p className="mt-2 text-sm text-n600">
          Your reference is <b className="font-mono text-ink">{result.id}</b>. Smash Pro will review your
          photos{voiceBlob ? " and voice note" : ""} and get in touch with a quotation.
        </p>
        <button
          type="button"
          onClick={() => { setResult(null); setPhotos([]); setVoiceBlob(null); setDescription(""); setServices([]); }}
          className="mt-5 text-sm font-semibold text-ember-deep underline-offset-2 hover:underline"
        >
          Book another service
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[4px] border border-n200 bg-chalk shadow-overlay">
      {/* tabs */}
      <div className="flex gap-1 border-b border-n200 p-1.5">
        <TabButton active={kind === "care"} onClick={() => setKind("care")}>Sports Care</TabButton>
        <TabButton active={kind === "repair"} onClick={() => setKind("repair")}>Sports Repairs</TabButton>
      </div>

      <div className="space-y-7 p-5 md:p-7">
        {/* sport */}
        <div>
          <span className={label}>Select sport</span>
          <div className="flex flex-wrap gap-2.5">
            {SERVICE_SPORTS.map((s) => (
              <PillRadio key={s.slug} active={sport === s.slug} onClick={() => setSport(s.slug)}>{s.label}</PillRadio>
            ))}
          </div>
        </div>

        {/* services */}
        <div>
          <span className={label}>Select service{services.length > 0 && ` (${services.length} selected)`}</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {catalog.map((svc) => (
              <label
                key={svc.slug}
                className={
                  "flex cursor-pointer items-center gap-2.5 rounded-[2px] border px-3.5 py-2.5 text-sm transition-colors " +
                  (services.includes(svc.slug) ? "border-ember-deep bg-paper text-ink" : "border-n400 bg-chalk text-ink hover:border-ink/40")
                }
              >
                <input
                  type="checkbox"
                  checked={services.includes(svc.slug)}
                  onChange={() => toggleService(svc.slug)}
                  className="h-4 w-4 accent-ember-deep"
                />
                {svc.label}
              </label>
            ))}
          </div>
        </div>

        {/* equipment details */}
        <div>
          <span className={label}>Equipment details</span>
          <div className="flex flex-wrap gap-2.5">
            <PillRadio active={equipmentSource === "own"} onClick={() => setEquipmentSource("own")}>My own existing equipment</PillRadio>
            <PillRadio active={equipmentSource === "new"} onClick={() => setEquipmentSource("new")}>New — purchased from Smash Pro</PillRadio>
          </div>
          <div className="mt-3 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="svc-brand">Brand</label>
              <input id="svc-brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Yonex / DSC" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="svc-model">Model</label>
              <input id="svc-model" type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Enter model" className={input} />
            </div>
          </div>
        </div>

        {/* damage assessment */}
        <div className="border-t border-n200 pt-6">
          <p className="mb-3 font-display text-base font-semibold text-ink">
            {kind === "care" ? "Care details" : "Damage assessment"}
          </p>
          <label className={label} htmlFor="svc-desc">Describe what you&apos;d like done</label>
          <textarea
            id="svc-desc" value={description} onChange={(e) => setDescription(e.target.value)}
            rows={4} placeholder="What's damaged? When did it happen? Any previous repairs?"
            className={`${input} h-auto py-2.5`}
          />

          <div className="mt-4">
            <span className={label}>
              Equipment photographs <span className="text-ember-deep">(required)</span>
            </span>
            <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[2px] border-2 border-dashed border-n400 bg-paper text-center transition-colors hover:border-ink/40">
              <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 fill-none stroke-current text-n600" strokeWidth="1.6">
                <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l1.5-3h5L16 7" /><circle cx="12" cy="13.5" r="3.2" />
              </svg>
              <span className="text-[13px] font-medium text-ink">Add photos</span>
              <span className="text-xs text-n600">Front, back and close-up of the damage — up to {MAX_PHOTOS}</span>
              <input
                type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }}
              />
            </label>
            {photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {photoUrls.map((url, i) => (
                  <div key={url} className="relative h-20 w-20 overflow-hidden rounded-[2px] border border-n200">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object-URL preview of a file the user just picked */}
                    <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-white"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden className="h-3 w-3 fill-none stroke-current" strokeWidth="2.5"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4">
            <span className={label}>Or explain by voice</span>
            <VoiceRecorder onChange={setVoiceBlob} />
          </div>
        </div>

        {/* contact */}
        <div className="border-t border-n200 pt-6">
          <p className="mb-3 font-display text-base font-semibold text-ink">Your contact details</p>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="svc-name">Full name (required)</label>
              <input id="svc-name" type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="svc-phone">Phone (required)</label>
              <input id="svc-phone" type="tel" required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="svc-email">Email</label>
              <input
                id="svc-email" type="email" value={displayEmail}
                onChange={(e) => { setEmailTouched(true); setContactEmail(e.target.value); }}
                className={input}
              />
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink">{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-n200 pt-6">
          <button type="submit" disabled={!canSubmit} className={primary}>
            {busy ? "Submitting…" : "Submit for inspection"}
          </button>
          <p className="text-xs text-n600">
            Repair price: quotation after inspection — no payment is collected now.
          </p>
        </div>
      </div>
    </form>
  );
}

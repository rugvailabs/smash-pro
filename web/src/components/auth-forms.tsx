"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRole } from "@/components/providers";
import { Banner, NoteFlag, Panel } from "@/components/buyer-ui";

/* ============================================================
   Sign-in + registration forms (integration point I1, ADR-0004).
   Registration creates the organization in PENDING status
   (Workflows A/H); approval is admin-side. Document "upload"
   records metadata only (ADR-0005). OBD-02 verification workflow
   stays ◇ — no review checklist is implied. OBD-15 open: one
   user per organization.
   ============================================================ */

const input = "h-11 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-base text-ink placeholder:text-n400 md:text-sm";
const label = "mb-1.5 block text-[13px] font-medium text-ink";
const primary = "inline-flex h-11 w-full items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400";

export function SignInForm() {
  const router = useRouter();
  const { refresh } = useRole();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed — please try again.");
        return;
      }
      await refresh();
      router.push("/");
      router.refresh();
    } catch {
      setError("Sign-in failed — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="p-6">
      <form onSubmit={submit}>
        <div className="mb-3.5">
          <label className={label} htmlFor="si-email">Email</label>
          <input id="si-email" type="email" autoComplete="email" required className={input}
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className={label} htmlFor="si-pw">Password</label>
          <input id="si-pw" type="password" autoComplete="current-password" required className={input}
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <Banner tone="bad" className="mb-3.5">{error}</Banner>}
        <button type="submit" disabled={busy || !email || !password} className={primary}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-n600">
        New to Smash Pro?{" "}
        <Link href="/register" className="font-semibold text-ember-deep hover:underline">Register your institution</Link>
        {" "}·{" "}
        <Link href="/register/supplier" className="font-semibold text-ember-deep hover:underline">Register as a supplier</Link>
      </p>
      <NoteFlag className="mt-3">
        demo accounts: buyer@demo.prosmash.in · supplier@demo.prosmash.in ·
        password &quot;prosmash-demo&quot;
      </NoteFlag>
    </Panel>
  );
}

const SUPPLIER_CATEGORY_OPTIONS = [
  ["cricket", "Cricket"], ["football", "Football"], ["basketball", "Basketball"],
  ["volleyball", "Volleyball"], ["badminton", "Badminton"], ["tennis", "Tennis"],
  ["athletics", "Athletics"], ["gym-fitness", "Gym & Fitness"], ["indoor-games", "Indoor Games"],
  ["outdoor-games", "Outdoor Games"], ["sportswear", "Sportswear"], ["accessories", "Accessories"],
] as const;

export function RegisterForm({ kind }: { kind: "buyer" | "supplier" }) {
  const router = useRouter();
  const { refresh } = useRole();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docs, setDocs] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [form, setForm] = useState({
    orgName: "", legalName: "", orgType: kind === "buyer" ? "School" : "Manufacturer",
    gstin: "", city: "", contactName: "", contactPhone: "", email: "", password: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const stageDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(e.target.files ?? []).map((f) => f.name);
    if (names.length) setDocs((d) => [...new Set([...d, ...names])]);
  };

  const canSubmit =
    form.orgName.trim() && form.legalName.trim() && form.contactName.trim() &&
    form.email.trim() && form.password.length >= 8 &&
    (kind === "buyer" || cats.length > 0) && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind, ...form,
          buyerCategory: kind === "buyer" ? form.orgType : undefined,
          categories: kind === "supplier" ? cats : undefined,
          documents: docs,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Registration failed — please try again.");
        return;
      }
      await refresh();
      router.push("/");
      router.refresh();
    } catch {
      setError("Registration failed — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const orgTypes = kind === "buyer"
    ? ["School", "Academy", "College", "Retailer", "Other institution"]
    : ["Manufacturer", "Wholesaler", "Distributor", "Dealer"];

  return (
    <Panel className="p-6">
      <form onSubmit={submit}>
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[.08em] text-n600">1 · Organization</div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="rg-name">{kind === "buyer" ? "Institution name" : "Business name"} (required)</label>
            <input id="rg-name" type="text" required className={input} value={form.orgName} onChange={set("orgName")} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="rg-legal">Legal name (required)</label>
            <input id="rg-legal" type="text" required className={input} value={form.legalName} onChange={set("legalName")} />
          </div>
          <div>
            <label className={label} htmlFor="rg-type">{kind === "buyer" ? "Institution type" : "Business type"}</label>
            <select id="rg-type" className={input} value={form.orgType} onChange={set("orgType")}>
              {orgTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="rg-city">City</label>
            <input id="rg-city" type="text" className={input} value={form.city} onChange={set("city")} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="rg-gstin">GSTIN</label>
            <input id="rg-gstin" type="text" className={`${input} font-mono`} value={form.gstin} onChange={set("gstin")} />
            <p className="mt-1 text-xs text-n600">Format checked at review — verification requirements pending confirmation (OBD-02 ◇)</p>
          </div>
        </div>

        {kind === "supplier" && (
          <>
            <div className="mb-2 mt-6 font-mono text-[11px] uppercase tracking-[.08em] text-n600">2 · Categories you supply (required)</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUPPLIER_CATEGORY_OPTIONS.map(([slug, name]) => (
                <label key={slug} className="flex cursor-pointer items-center gap-2 rounded-[2px] border border-n200 bg-chalk px-3 py-2 text-sm hover:border-n400">
                  <input
                    type="checkbox"
                    checked={cats.includes(slug)}
                    onChange={(e) => setCats((c) => e.target.checked ? [...c, slug] : c.filter((x) => x !== slug))}
                    className="accent-[var(--color-ember-deep)]"
                  />
                  {name}
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-n600">Requirements are matched to approved categories after review.</p>
          </>
        )}

        <div className="mb-2 mt-6 font-mono text-[11px] uppercase tracking-[.08em] text-n600">
          {kind === "supplier" ? "3" : "2"} · Contact &amp; account
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="rg-contact">Contact person (required)</label>
            <input id="rg-contact" type="text" required className={input} value={form.contactName} onChange={set("contactName")} />
          </div>
          <div>
            <label className={label} htmlFor="rg-phone">Phone</label>
            <input id="rg-phone" type="tel" className={input} value={form.contactPhone} onChange={set("contactPhone")} />
          </div>
          <div>
            <label className={label} htmlFor="rg-email">Email (required)</label>
            <input id="rg-email" type="email" autoComplete="email" required className={input} value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label className={label} htmlFor="rg-pw">Password (required, 8+ characters)</label>
            <input id="rg-pw" type="password" autoComplete="new-password" required minLength={8} className={input} value={form.password} onChange={set("password")} />
          </div>
        </div>

        <div className="mb-2 mt-6 font-mono text-[11px] uppercase tracking-[.08em] text-n600">
          {kind === "supplier" ? "4" : "3"} · Documents
        </div>
        <label className="inline-flex h-10 cursor-pointer items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink">
          Add documents
          <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={stageDoc} />
        </label>
        {docs.length > 0 && (
          <ul className="mt-2 space-y-1">
            {docs.map((d) => (
              <li key={d} className="font-mono text-xs text-ink">{d}</li>
            ))}
          </ul>
        )}
        <NoteFlag className="mt-2">
          gst certificate · {kind === "buyer" ? "affiliation/registration letter" : "pan · udyam registration"} ·
          file metadata only is retained in this phase (adr-0005) · exact
          document requirements pending confirmation (obd-02 ◇)
        </NoteFlag>

        {error && <Banner tone="bad" className="mt-4">{error}</Banner>}
        <button type="submit" disabled={!canSubmit} className={`${primary} mt-5`}>
          {busy ? "Registering…" : "Submit registration"}
        </button>
        <p className="mt-2.5 text-[13px] text-n600">
          Your registration is reviewed by Smash Pro before {kind === "buyer" ? "ordering" : "the workspace"} is
          enabled — you can sign in meanwhile and track its status.
        </p>
      </form>
    </Panel>
  );
}

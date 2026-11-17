"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NoteFlag, Panel } from "@/components/buyer-ui";
import { useToast } from "@/components/toast";

/* ============================================================
   Supplier profile edits (SUP-003). Contact name / phone apply
   DIRECTLY. Sensitive fields (legal name / GSTIN / bank) and
   category changes are RECORDED and routed to Smash Pro
   re-review — never applied here (OBD-19 Option C).
   ============================================================ */

const CATEGORY_OPTIONS = [
  "Cricket", "Athletics", "Gym & Fitness", "Football", "Basketball", "Volleyball",
  "Badminton", "Tennis", "Indoor Games", "Outdoor Games", "Sportswear", "Accessories",
];

const SENSITIVE_FIELDS: { value: string; label: string }[] = [
  { value: "legalName", label: "Legal name" },
  { value: "gstin", label: "GSTIN" },
  { value: "bank", label: "Bank details" },
];

const inputCls = "h-10 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink placeholder:text-n400";
const btnPri = "inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400";
const btnSec = "inline-flex h-10 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink";
const linkBtn = "text-[13px] font-semibold text-ember-deep hover:underline";

function Err({ msg }: { msg: string | null }) {
  return msg ? <p role="alert" className="mt-3 border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink">{msg}</p> : null;
}

/** Contact edit (applies directly) + sensitive-field change request. */
export function SupplierBusinessEdit({ contactName }: { contactName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<"none" | "contact" | "sensitive">("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState({ name: contactName, phone: "" });
  const [sensitive, setSensitive] = useState({ field: "legalName", newValue: "", note: "" });

  const saveContact = async () => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/supplier/profile/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contactName: contact.name.trim(), contactPhone: contact.phone.trim() }),
      });
      if (res.ok) {
        toast("Contact details updated.");
        setMode("none");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not update contact details.");
      }
    } catch {
      setError("Could not update — check your connection and try again.");
    } finally { setBusy(false); }
  };

  const sendSensitive = async () => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/supplier/profile/sensitive-change", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ field: sensitive.field, newValue: sensitive.newValue.trim(), note: sensitive.note.trim() || undefined }),
      });
      if (res.ok) {
        toast("Change requested — Smash Pro will re-review.");
        setMode("none");
        setSensitive({ field: "legalName", newValue: "", note: "" });
        router.refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not submit the request.");
      }
    } catch {
      setError("Could not submit — check your connection and try again.");
    } finally { setBusy(false); }
  };

  if (mode === "contact") {
    return (
      <div className="pt-3.5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="c-name">Contact name</label>
            <input id="c-name" className={inputCls} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="c-phone">Contact phone</label>
            <input id="c-phone" className={inputCls} placeholder="e.g. +91 98xxxxxxx" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
          </div>
        </div>
        <Err msg={error} />
        <div className="mt-3 flex gap-3">
          <button onClick={() => void saveContact()} disabled={busy || !contact.name.trim()} className={btnPri}>{busy ? "Saving…" : "Save contact details"}</button>
          <button onClick={() => { setMode("none"); setError(null); }} className="text-sm font-medium text-n600 hover:text-ink">Cancel</button>
        </div>
      </div>
    );
  }

  if (mode === "sensitive") {
    return (
      <div className="pt-3.5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="s-field">Field</label>
            <select id="s-field" className={inputCls} value={sensitive.field} onChange={(e) => setSensitive({ ...sensitive, field: e.target.value })}>
              {SENSITIVE_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="s-value">New value</label>
            <input id="s-value" className={inputCls} value={sensitive.newValue} onChange={(e) => setSensitive({ ...sensitive, newValue: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="s-note">Note (optional)</label>
            <input id="s-note" className={inputCls} placeholder="Reason for the change" value={sensitive.note} onChange={(e) => setSensitive({ ...sensitive, note: e.target.value })} />
          </div>
        </div>
        <Err msg={error} />
        <div className="mt-3 flex gap-3">
          <button onClick={() => void sendSensitive()} disabled={busy || !sensitive.newValue.trim()} className={btnPri}>{busy ? "Submitting…" : "Request change"}</button>
          <button onClick={() => { setMode("none"); setError(null); }} className="text-sm font-medium text-n600 hover:text-ink">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 pt-3.5">
      <button onClick={() => setMode("contact")} className={btnSec}>Edit contact details</button>
      <button onClick={() => setMode("sensitive")} className={linkBtn}>Request a change to legal name / GSTIN / bank</button>
    </div>
  );
}

/** Category-change request (recorded + routed to re-review). */
export function SupplierCategoryRequest({ categories }: { categories: string[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(categories);
  const [note, setNote] = useState("");

  const toggle = (c: string) =>
    setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  const submit = async () => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/supplier/profile/category-change", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categories: selected, note: note.trim() || undefined }),
      });
      if (res.ok) {
        toast("Category change requested — Smash Pro will review.");
        setOpen(false);
        router.refresh();
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not submit the request.");
      }
    } catch {
      setError("Could not submit — check your connection and try again.");
    } finally { setBusy(false); }
  };

  if (!open) {
    return <div className="pt-3"><button onClick={() => setOpen(true)} className={linkBtn}>Request a category change</button></div>;
  }

  return (
    <Panel className="mt-3 p-4">
      <div className="mb-2.5 text-sm font-semibold text-ink">Request categories</div>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((c) => {
          const on = selected.includes(c);
          return (
            <button key={c} onClick={() => toggle(c)} aria-pressed={on}
              className={"inline-flex h-8 items-center rounded-[2px] border px-2.5 text-[13px] font-medium " + (on ? "border-ember-deep bg-ember-deep/5 text-ember-deep" : "border-n400 bg-chalk text-n600 hover:border-ink")}>
              {c}
            </button>
          );
        })}
      </div>
      <input className={`${inputCls} mt-3`} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <NoteFlag className="mt-2.5">requested categories take effect only after smash pro review</NoteFlag>
      <Err msg={error} />
      <div className="mt-3 flex gap-3">
        <button onClick={() => void submit()} disabled={busy || selected.length === 0} className={btnPri}>{busy ? "Submitting…" : "Submit request"}</button>
        <button onClick={() => { setOpen(false); setError(null); }} className="text-sm font-medium text-n600 hover:text-ink">Cancel</button>
      </div>
    </Panel>
  );
}

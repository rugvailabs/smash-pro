"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banner, KV, Panel } from "@/components/buyer-ui";
import type { BuyerAccount } from "@/lib/buyer-api";

/* ============================================================
   Institutional account editing (BUY-009). DECIDED rule:
   - contact name / phone (non-sensitive) apply immediately
   - legal name / GSTIN (sensitive) route to Smash Pro re-review
     and do NOT change until an admin actions them.
   No verification checklist is invented (OBD-02 ◇ pending).
   ============================================================ */

const inputCls =
  "h-10 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink placeholder:text-n400";
const btnSec =
  "inline-flex h-10 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";
const btnPri =
  "inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400";
const btnTer = "text-[13px] font-semibold text-ember-deep hover:underline disabled:opacity-60";
const lblCls = "mb-1 block text-[11px] font-mono uppercase tracking-wide text-n600";

async function send(url: string, init: RequestInit): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "content-type": "application/json" }, ...init });
    if (res.ok) return null;
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    return data?.error ?? "That didn't go through — please try again.";
  } catch {
    return "That didn't go through — check your connection and try again.";
  }
}

const SENSITIVE = {
  legalName: { label: "Legal name", placeholder: "Registered legal name" },
  gstin: { label: "GSTIN", placeholder: "15-character GSTIN" },
} as const;
type SField = keyof typeof SENSITIVE;

export function BuyerAccountEdit({ account }: { account: BuyerAccount }) {
  const router = useRouter();

  // contact (direct save)
  const [editContact, setEditContact] = useState(false);
  const [name, setName] = useState(account.contactName);
  const [phone, setPhone] = useState(account.contactPhone);
  const [cBusy, setCBusy] = useState(false);
  const [cErr, setCErr] = useState<string | null>(null);

  // sensitive change request
  const [field, setField] = useState<SField | null>(null);
  const [newValue, setNewValue] = useState("");
  const [note, setNote] = useState("");
  const [sBusy, setSBusy] = useState(false);
  const [sErr, setSErr] = useState<string | null>(null);
  const [sSent, setSSent] = useState(false);

  const saveContact = async () => {
    if (cBusy) return;
    setCBusy(true);
    setCErr(null);
    const err = await send("/api/account/contact", {
      method: "PATCH",
      body: JSON.stringify({ contactName: name, contactPhone: phone }),
    });
    setCBusy(false);
    if (err) { setCErr(err); return; }
    setEditContact(false);
    router.refresh();
  };

  const openRequest = (f: SField) => {
    setSSent(false);
    setSErr(null);
    setField(f);
    setNewValue("");
    setNote("");
  };

  const submitRequest = async () => {
    if (sBusy || !field) return;
    setSBusy(true);
    setSErr(null);
    const err = await send("/api/account/change-request", {
      method: "POST",
      body: JSON.stringify({ field, newValue, note: note.trim() || undefined }),
    });
    setSBusy(false);
    if (err) { setSErr(err); return; }
    setField(null);
    setSSent(true);
  };

  return (
    <>
      <Panel className="px-5 py-4">
        {/* sensitive fields — display only, changed via re-review */}
        <KV k="Legal name">
          <span className="inline-flex items-center gap-2">
            {account.legalName || "—"}
            <button className={btnTer} onClick={() => openRequest("legalName")}>Request change</button>
          </span>
        </KV>
        <KV k="Organization type">{account.orgType || "—"}</KV>
        <KV k="GSTIN">
          <span className="inline-flex items-center gap-2">
            <span className="font-mono text-[12.5px]">{account.gstin || "—"}</span>
            <button className={btnTer} onClick={() => openRequest("gstin")}>Request change</button>
          </span>
        </KV>

        {/* non-sensitive contact — direct edit */}
        {editContact ? (
          <div className="mt-3 border-t border-n100 pt-3.5">
            <label className={lblCls} htmlFor="c-name">Contact name</label>
            <input id="c-name" className={inputCls} value={name} maxLength={120}
              placeholder="Full name" onChange={(e) => setName(e.target.value)} />
            <label className={`${lblCls} mt-3`} htmlFor="c-phone">Contact phone</label>
            <input id="c-phone" className={inputCls} value={phone} maxLength={30} inputMode="tel"
              placeholder="e.g. +91 98765 43210" onChange={(e) => setPhone(e.target.value)} />
            {cErr && (
              <p role="alert" className="mt-2 border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink">{cErr}</p>
            )}
            <div className="mt-3 flex gap-2.5">
              <button className={btnPri} disabled={cBusy || !name.trim() || !phone.trim()} onClick={() => void saveContact()}>
                {cBusy ? "Saving…" : "Save contact details"}
              </button>
              <button className={btnSec} disabled={cBusy} onClick={() => { setEditContact(false); setCErr(null); setName(account.contactName); setPhone(account.contactPhone); }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <KV k="Contact">{account.contactName || "—"}</KV>
            <KV k="Phone">{account.contactPhone || "—"}</KV>
            <KV k="Email">{account.email || "—"}</KV>
            <div className="pt-3.5">
              <button className={btnSec} onClick={() => { setEditContact(true); setName(account.contactName); setPhone(account.contactPhone); }}>
                Edit contact details
              </button>
            </div>
          </>
        )}
      </Panel>

      {/* sensitive-field change request */}
      {field && (
        <Panel className="mt-2.5 px-5 py-4">
          <div className="mb-2.5 text-[11px] font-mono uppercase tracking-wide text-n600">
            Request {SENSITIVE[field].label} change
          </div>
          <label className={lblCls} htmlFor="s-value">New {SENSITIVE[field].label.toLowerCase()}</label>
          <input id="s-value" className={inputCls} value={newValue}
            maxLength={field === "gstin" ? 20 : 160}
            placeholder={SENSITIVE[field].placeholder}
            onChange={(e) => setNewValue(e.target.value)} />
          <label className={`${lblCls} mt-3`} htmlFor="s-note">Note for Smash Pro (optional)</label>
          <textarea id="s-note" rows={2}
            className="w-full rounded-[2px] border border-n400 bg-chalk p-3 text-sm text-ink placeholder:text-n400"
            value={note} maxLength={500}
            placeholder="Reason / supporting context for the review"
            onChange={(e) => setNote(e.target.value)} />
          {sErr && (
            <p role="alert" className="mt-2 border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink">{sErr}</p>
          )}
          <div className="mt-3 flex gap-2.5">
            <button className={btnPri} disabled={sBusy || !newValue.trim()} onClick={() => void submitRequest()}>
              {sBusy ? "Submitting…" : "Submit for re-review"}
            </button>
            <button className={btnSec} disabled={sBusy} onClick={() => { setField(null); setSErr(null); }}>Cancel</button>
          </div>
          <p className="mt-2.5 text-[12.5px] text-n600">
            This does not change your profile now. Smash Pro reviews legal name
            and GSTIN changes before they take effect.
          </p>
        </Panel>
      )}
      {sSent && !field && (
        <Banner tone="ok" className="mt-2.5">
          <b className="text-ink">Change request submitted.</b> Smash Pro has been
          notified and will review it before the field is updated.
        </Banner>
      )}
    </>
  );
}

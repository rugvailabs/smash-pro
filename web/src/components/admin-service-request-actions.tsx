"use client";

import { useState } from "react";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { btnEmberSm, inputCls, labelCls } from "@/components/admin-ui";
import type { AdminServiceRequestRow } from "@/lib/admin-types";

/* Service request triage (ADR-0020): admin enters a quote (manual —
   no pricing engine involved, inspection-based) and/or moves status.
   No payment flow is wired to this; collecting one is a separate,
   not-yet-decided feature. */

const STATUS_OPTIONS: { value: AdminServiceRequestRow["status"]; label: string }[] = [
  { value: "new", label: "New" },
  { value: "quoted", label: "Quoted" },
  { value: "approved", label: "Approved" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

export function ServiceRequestActions({ request }: { request: AdminServiceRequestRow }) {
  const { busy, error, call } = useAdminCall();
  const [status, setStatus] = useState(request.status);
  const [quoted, setQuoted] = useState(request.quoted !== null ? String(request.quoted) : "");
  const [note, setNote] = useState(request.adminNote ?? "");

  const quotedTrimmed = quoted.trim();
  const quotedNum = parseFloat(quotedTrimmed);
  const quotedValid = quotedTrimmed === "" || (Number.isFinite(quotedNum) && quotedNum >= 0);

  const dirty =
    status !== request.status ||
    quotedTrimmed !== (request.quoted !== null ? String(request.quoted) : "") ||
    note.trim() !== (request.adminNote ?? "");

  const save = async () => {
    if (!quotedValid || !dirty) return;
    const body: { status?: string; quoted?: number; adminNote?: string } = {};
    if (status !== request.status) body.status = status;
    if (quotedTrimmed !== "" && quotedNum !== request.quoted) body.quoted = quotedNum;
    if (note.trim() !== (request.adminNote ?? "")) body.adminNote = note.trim();
    await call(`/api/admin/service-requests/${encodeURIComponent(request.id)}`, {
      method: "PATCH",
      body,
      done: `${request.id} updated.`,
    });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div>
        <label className={labelCls} htmlFor={`sr-status-${request.id}`}>Status</label>
        <select
          id={`sr-status-${request.id}`} value={status}
          onChange={(e) => setStatus(e.target.value as AdminServiceRequestRow["status"])}
          className={inputCls}
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls} htmlFor={`sr-quote-${request.id}`}>Quote, ₹</label>
        <input
          id={`sr-quote-${request.id}`} type="number" min={0} step="0.01" value={quoted}
          onChange={(e) => setQuoted(e.target.value)} placeholder="After inspection" className={`${inputCls} num`}
        />
        {!quotedValid && <p className="mt-1 text-xs font-medium text-warn">Must be a non-negative amount.</p>}
      </div>
      <div className="sm:col-span-3">
        <label className={labelCls} htmlFor={`sr-note-${request.id}`}>Admin note</label>
        <textarea
          id={`sr-note-${request.id}`} value={note} onChange={(e) => setNote(e.target.value)}
          rows={2} className={`${inputCls} h-auto py-2`} placeholder="Internal note — not shown to the customer yet"
        />
      </div>
      <div className="sm:col-span-3 flex items-center gap-2.5">
        <button onClick={() => void save()} disabled={busy || !dirty || !quotedValid} className={btnEmberSm}>
          {busy ? "Saving…" : "Save"}
        </button>
        <ActionError error={error} className="mt-0" />
      </div>
    </div>
  );
}

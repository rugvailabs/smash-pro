"use client";

import { useState } from "react";
import { NoteFlag, Panel, PanelHead } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { ADMIN_CATEGORIES, AuditNote, btnEmber, inputCls, labelCls } from "@/components/admin-ui";

/* ============================================================
   Publish a sourcing requirement — Workflow: admin-managed
   supplier procurement. Matched suppliers (approved for the
   category) see it and quote; supplier identities and competing
   quotes stay isolated per the boundary rules.
   ============================================================ */

export function RequirementForm() {
  const { busy, error, call } = useAdminCall();
  const [form, setForm] = useState({
    title: "", catSlug: "cricket", qty: "",
    destination: "warehouse" as "warehouse" | "direct",
    closes: "", requiredBy: "",
  });
  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const canSubmit =
    form.title.trim().length > 0 && form.qty.trim().length > 0 &&
    form.closes.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    if (
      await call("/api/admin/requirements", {
        body: {
          title: form.title.trim(),
          catSlug: form.catSlug,
          qty: form.qty.trim(),
          destination: form.destination,
          closes: form.closes.trim(),
          requiredBy: form.requiredBy.trim() || undefined,
        },
        done: "Requirement published to matched suppliers.",
      })
    ) {
      setForm({ title: "", catSlug: form.catSlug, qty: "", destination: "warehouse", closes: "", requiredBy: "" });
    }
  };

  return (
    <Panel>
      <PanelHead title="New requirement" />
      <div className="p-4">
        <div className="grid gap-3.5">
          <div>
            <label className={labelCls} htmlFor="rf-title">Title (required)</label>
            <input id="rf-title" type="text" value={form.title} onChange={set("title")}
              placeholder="e.g. Competition basketballs, size 7 — FIBA approved" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="rf-cat">Category (required)</label>
              <select id="rf-cat" value={form.catSlug} onChange={set("catSlug")} className={inputCls}>
                {ADMIN_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="rf-qty">Quantity (required)</label>
              <input id="rf-qty" type="text" value={form.qty} onChange={set("qty")}
                placeholder="e.g. 300 units" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="rf-dest">Fulfilment destination</label>
            <select
              id="rf-dest"
              value={form.destination}
              onChange={set("destination")}
              className={inputCls}
            >
              <option value="warehouse">ProSmash warehouse</option>
              <option value="direct">Direct to buyer</option>
            </select>
            <NoteFlag className="mt-1">
              direct fulfilment awards only to suppliers with the direct
              privilege (obd-19 — grant criteria ◇ pending)
            </NoteFlag>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="rf-closes">Quotes close (required)</label>
              <input id="rf-closes" type="text" value={form.closes} onChange={set("closes")}
                placeholder="DD MMM YYYY" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="rf-reqby">Required by</label>
              <input id="rf-reqby" type="text" value={form.requiredBy} onChange={set("requiredBy")}
                placeholder="DD MMM YYYY" className={inputCls} />
            </div>
          </div>
        </div>
        <ActionError error={error} />
        <button onClick={() => void submit()} disabled={!canSubmit} className={`${btnEmber} mt-4`}>
          {busy ? "Publishing…" : "Publish requirement"}
        </button>
        <AuditNote />
      </div>
    </Panel>
  );
}

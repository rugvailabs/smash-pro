"use client";

import { useState } from "react";
import { NoteFlag, Panel, PanelHead } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { ADMIN_CATEGORIES, AuditNote, btnEmber, inputCls, labelCls } from "@/components/admin-ui";

/* ============================================================
   Add product to the master catalogue. Photography arrives only
   through the approved programme (no image field by design);
   GST rate / HSN fields are deliberately absent — pending
   OBD-20 / OBD-11 and professional tax validation.
   ============================================================ */

const SKU_RE = /^[A-Z]{2}-\d{4}$/;

export function ProductForm() {
  const { busy, error, call } = useAdminCall();
  const [form, setForm] = useState({
    sku: "", name: "", catSlug: "cricket", sub: "", meta: "", std: "",
  });
  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const sku = form.sku.trim().toUpperCase();
  const std = parseFloat(form.std);
  const canSubmit =
    SKU_RE.test(sku) && form.name.trim().length > 0 && form.sub.trim().length > 0 &&
    Number.isFinite(std) && std > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    if (
      await call("/api/admin/products", {
        body: {
          sku,
          name: form.name.trim(),
          catSlug: form.catSlug,
          sub: form.sub.trim(),
          meta: form.meta.trim() || undefined,
          std,
        },
        done: `${sku} added to the catalogue.`,
      })
    ) {
      setForm({ sku: "", name: "", catSlug: form.catSlug, sub: "", meta: "", std: "" });
    }
  };

  return (
    <Panel>
      <PanelHead title="Add product" />
      <div className="p-4">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="pf-sku">SKU (required)</label>
            <input id="pf-sku" type="text" value={form.sku} onChange={set("sku")}
              placeholder="CR-0418" className={`${inputCls} font-mono uppercase`} />
            <p className="mt-1 text-xs text-n600">Format XX-0000 — two-letter category code, four digits</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="pf-cat">Category (required)</label>
            <select id="pf-cat" value={form.catSlug} onChange={set("catSlug")} className={inputCls}>
              {ADMIN_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="pf-name">Product name (required)</label>
            <input id="pf-name" type="text" value={form.name} onChange={set("name")}
              placeholder="e.g. Match Cricket Ball — 4-piece leather" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pf-sub">Subcategory (required)</label>
            <input id="pf-sub" type="text" value={form.sub} onChange={set("sub")}
              placeholder="e.g. Balls" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pf-std">Standard listed price, ₹ (required)</label>
            <input id="pf-std" type="number" min={0.01} step="0.01" value={form.std} onChange={set("std")}
              className={`${inputCls} num`} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="pf-meta">Meta line</label>
            <input id="pf-meta" type="text" value={form.meta} onChange={set("meta")}
              placeholder="e.g. Alum-tanned leather · BCCI match grade" className={inputCls} />
          </div>
        </div>
        <ActionError error={error} />
        <button onClick={() => void submit()} disabled={!canSubmit} className={`${btnEmber} mt-4`}>
          {busy ? "Adding…" : "Add product"}
        </button>
        <NoteFlag className="mt-3">
          photography via the approved programme only — no image upload here ·
          gst rate / hsn fields absent, pending obd-20 / obd-11 + tax
          validation
        </NoteFlag>
        <AuditNote />
      </div>
    </Panel>
  );
}

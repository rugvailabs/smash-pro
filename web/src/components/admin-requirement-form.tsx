"use client";

import { useState } from "react";
import { NoteFlag, Panel, PanelHead } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { ADMIN_CATEGORIES, AuditNote, btnEmber, btnGhostSm, inputCls, labelCls } from "@/components/admin-ui";

/* ============================================================
   Publish a sourcing requirement — Workflow: admin-managed
   supplier procurement. One requirement can carry several product
   lines (a single publish, a single close date, a single set of
   matched suppliers) — each line gets its own title/category/qty
   and is quoted, awarded and PO'd per line. Matched suppliers
   (approved for the category) see it and quote; supplier
   identities and competing quotes stay isolated per the boundary
   rules.
   ============================================================ */

type Item = { title: string; catSlug: string; qty: string };

const blankItem = (catSlug: string): Item => ({ title: "", catSlug, qty: "" });

export function RequirementForm() {
  const { busy, error, call } = useAdminCall();
  const [items, setItems] = useState<Item[]>([blankItem("cricket")]);
  const [form, setForm] = useState({
    destination: "warehouse" as "warehouse" | "direct",
    closes: "", requiredBy: "",
  });
  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const setItem = (i: number, k: keyof Item) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: e.target.value } : it)));

  const addItem = () => setItems([...items, blankItem(items[items.length - 1]?.catSlug ?? "cricket")]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const canSubmit =
    items.length > 0 &&
    items.every((it) => it.title.trim().length > 0 && it.qty.trim().length > 0) &&
    form.closes.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    if (
      await call("/api/admin/requirements", {
        body: {
          items: items.map((it) => ({ title: it.title.trim(), catSlug: it.catSlug, qty: it.qty.trim() })),
          destination: form.destination,
          closes: form.closes.trim(),
          requiredBy: form.requiredBy.trim() || undefined,
        },
        done: items.length > 1
          ? `Requirement published with ${items.length} product lines.`
          : "Requirement published to matched suppliers.",
      })
    ) {
      setItems([blankItem(items[items.length - 1]?.catSlug ?? "cricket")]);
      setForm({ destination: form.destination, closes: "", requiredBy: "" });
    }
  };

  return (
    <Panel>
      <PanelHead title="New requirement" />
      <div className="p-4">
        <div className="grid gap-3.5">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className={labelCls}>Products (required)</span>
              <button type="button" onClick={addItem} disabled={busy} className={btnGhostSm}>
                + Add product
              </button>
            </div>
            <div className="space-y-2.5">
              {items.map((it, i) => (
                <div key={i} className="rounded-[2px] border border-n200 bg-paper p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-n400">
                      Product {i + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        disabled={busy}
                        className="font-mono text-[10px] uppercase tracking-wide text-n600 hover:text-bad"
                      >
                        remove
                      </button>
                    )}
                  </div>
                  <div className="mt-1.5 grid gap-2.5">
                    <input
                      type="text" value={it.title} onChange={setItem(i, "title")}
                      placeholder="e.g. Competition basketballs, size 7 — FIBA approved"
                      className={inputCls} aria-label={`Product ${i + 1} title`}
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <select value={it.catSlug} onChange={setItem(i, "catSlug")} className={inputCls} aria-label={`Product ${i + 1} category`}>
                        {ADMIN_CATEGORIES.map((c) => (
                          <option key={c.slug} value={c.slug}>{c.label}</option>
                        ))}
                      </select>
                      <input
                        type="text" value={it.qty} onChange={setItem(i, "qty")}
                        placeholder="e.g. 300 units" className={inputCls} aria-label={`Product ${i + 1} quantity`}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
              <option value="warehouse">Smash Pro warehouse</option>
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
          {busy ? "Publishing…" : items.length > 1 ? `Publish requirement (${items.length} products)` : "Publish requirement"}
        </button>
        <AuditNote />
      </div>
    </Panel>
  );
}

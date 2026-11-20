"use client";

import { useMemo, useState } from "react";
import { Chip } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import {
  btnEmberSm, btnGhostSm, catLabel, tdCls, thCls, trCls,
} from "@/components/admin-ui";
import { ActiveToggle, StdPriceCell } from "@/components/admin-catalog-controls";
import type { AdminProductRow } from "@/lib/admin-types";

/* ============================================================
   Bulk catalogue operations: row checkboxes + a bulk action bar
   (activate / deactivate the selection) layered OVER the existing
   single-item inline controls (StdPriceCell / ActiveToggle stay
   fully functional). Plus a category-default discount quick form
   (OBD-20 decided structure — upsert the category-default rule).
   Every bulk op is one audited server action.
   ============================================================ */

export function BulkCatalog({ products }: { products: AdminProductRow[] }) {
  const { busy, error, call } = useAdminCall();
  const [sel, setSel] = useState<Set<string>>(new Set());

  const allSkus = useMemo(() => products.map((p) => p.sku), [products]);
  const allSelected = sel.size > 0 && sel.size === products.length;

  const toggle = (sku: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });

  const toggleAll = () =>
    setSel((prev) => (prev.size === products.length ? new Set() : new Set(allSkus)));

  const bulkActive = async (active: boolean) => {
    if (sel.size === 0) return;
    const skus = [...sel];
    if (
      await call("/api/admin/products/bulk-active", {
        body: { skus, active },
        done: `${skus.length} product${skus.length === 1 ? "" : "s"} ${active ? "activated" : "deactivated"}.`,
      })
    ) {
      setSel(new Set());
    }
  };

  return (
    <div>
      {/* bulk action bar — only present with a selection */}
      <div className="mb-2.5 flex min-h-9 flex-wrap items-center gap-2.5">
        {sel.size === 0 ? (
          <span className="font-mono text-[10px] uppercase tracking-wide text-n400">
            select rows to activate or deactivate in bulk
          </span>
        ) : (
          <>
            <Chip tone="info">{sel.size} selected</Chip>
            <button onClick={() => void bulkActive(true)} disabled={busy} className={btnEmberSm}>
              {busy ? "Working…" : "Activate selected"}
            </button>
            <button onClick={() => void bulkActive(false)} disabled={busy} className={btnGhostSm}>
              Deactivate selected
            </button>
            <button
              onClick={() => setSel(new Set())}
              disabled={busy}
              className="font-mono text-[10px] uppercase tracking-wide text-n600 hover:text-ink"
            >
              clear
            </button>
          </>
        )}
      </div>
      <ActionError error={error} className="mb-2.5 mt-0" />

      <div className="overflow-x-auto overflow-y-auto rounded-[2px] border border-n200 bg-chalk" style={{ maxHeight: 620 }}>
        <table className="w-full border-collapse text-sm" style={{ minWidth: 1120 }}>
          <thead>
            <tr>
              <th className={`${thCls} w-10`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = sel.size > 0 && !allSelected;
                  }}
                  onChange={toggleAll}
                  aria-label="Select all products"
                  className="h-3.5 w-3.5 accent-ember-deep align-middle"
                />
              </th>
              {["SKU", "Product", "Category", "Sub", "Brand"].map((h) => (
                <th key={h} className={thCls}>{h}</th>
              ))}
              <th className={`${thCls} text-right`}>Std price</th>
              <th className={thCls}>Photography</th>
              <th className={thCls}>Active</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const checked = sel.has(p.sku);
              return (
                <tr key={p.sku} className={`${trCls} ${checked ? "bg-paper" : ""}`}>
                  <td className={tdCls}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(p.sku)}
                      aria-label={`Select ${p.sku}`}
                      className="h-3.5 w-3.5 accent-ember-deep align-middle"
                    />
                  </td>
                  <td className={`${tdCls} font-mono text-[12.5px] text-ink`}>{p.sku}</td>
                  <td className={tdCls}>
                    {p.name}
                    {p.configurable && (
                      <span className="ml-2 font-mono text-[9px] uppercase tracking-wide text-n400">config</span>
                    )}
                  </td>
                  <td className={tdCls}>{catLabel(p.catSlug)}</td>
                  <td className={tdCls}>{p.sub}</td>
                  <td className={tdCls}>{p.brand ?? <span className="text-n400">—</span>}</td>
                  <td className={`${tdCls} whitespace-nowrap text-right`}>
                    <StdPriceCell sku={p.sku} std={p.std} />
                  </td>
                  <td className={tdCls}>
                    {p.hasImg ? (
                      <span className="font-mono text-[10px] uppercase tracking-wide text-n400">on file</span>
                    ) : (
                      <Chip tone="warn">No photo</Chip>
                    )}
                  </td>
                  <td className={tdCls}><ActiveToggle sku={p.sku} active={p.active} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Category-default discount quick form — upserts the category-default price
   rule (OBD-20). Lives beside the catalogue; full rule management stays on the
   Pricing surface. */
export function CategoryDiscountForm({ categories }: { categories: { slug: string; label: string }[] }) {
  const { busy, error, call } = useAdminCall();
  const [catSlug, setCatSlug] = useState(categories[0]?.slug ?? "");
  const [pct, setPct] = useState("");

  const pctNum = parseFloat(pct);
  const bp = Number.isFinite(pctNum) ? Math.round(pctNum * 100) : NaN;
  const ok = catSlug !== "" && Number.isInteger(bp) && bp >= 0 && bp <= 9000;

  const apply = async () => {
    if (!ok) return;
    if (
      await call("/api/admin/pricing/category-discount", {
        body: { catSlug, discountBp: bp },
        done: `${catLabel(catSlug)} category discount set to ${bp} bp.`,
      })
    ) {
      setPct("");
    }
  };

  return (
    <div className="rounded-[2px] border border-n200 bg-chalk p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="cat-disc-cat">Category</label>
          <select
            id="cat-disc-cat"
            value={catSlug}
            onChange={(e) => setCatSlug(e.target.value)}
            className="h-9 w-48 rounded-[2px] border border-n400 bg-chalk px-2.5 text-[13px] text-ink"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="cat-disc-pct">Discount %</label>
          <input
            id="cat-disc-pct"
            type="number"
            min={0}
            max={90}
            step="0.01"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder="e.g. 15"
            className="num h-9 w-28 rounded-[2px] border border-n400 bg-chalk px-2.5 text-[13px] text-ink placeholder:text-n400"
          />
        </div>
        <button onClick={() => void apply()} disabled={busy || !ok} className={btnEmberSm}>
          {busy ? "Applying…" : "Apply to category"}
        </button>
      </div>
      {pct !== "" && !ok && (
        <p className="mt-2 text-xs font-medium text-warn">
          Enter a percentage between 0 and 90 (max 9000 bp).
        </p>
      )}
      <ActionError error={error} />
      <p className="mt-2.5 font-mono text-[10px] uppercase tracking-wide text-n400">
        upserts the category-default rule · every approved buyer · applies before gst (obd-20)
      </p>
    </div>
  );
}

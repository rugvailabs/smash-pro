"use client";

import { useMemo, useState } from "react";
import { Chip } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import {
  ADMIN_CATEGORIES, btnEmberSm, btnGhostSm, catLabel, inputCls, labelCls, tdCls, thCls, trCls,
} from "@/components/admin-ui";
import { ActiveToggle, InStockToggle, ProductThumbnail } from "@/components/admin-catalog-controls";
import { EditProductButton } from "@/components/admin-product-edit";
import { inr } from "@/lib/format";
import type { AdminProductRow } from "@/lib/admin-types";

/* ============================================================
   Bulk catalogue operations: a client-side search + category/brand
   filter bar (the full list is already fetched, so filtering is
   instant — no round trip) over row checkboxes + a bulk action bar
   (activate / deactivate the selection), layered OVER the existing
   single-item inline controls (Active/inStock toggles stay fully
   functional on filtered rows). Every other field used to have its
   own per-cell inline edit here; those were removed once the
   row-level "Edit" action (last column) covered all of them in one
   consolidated form — the table displays those values as plain
   text/read-only now. Plus a category-default discount quick form
   (OBD-20 decided structure — upsert the category-default rule).
   Every mutation is one audited server action.
   ============================================================ */

export function BulkCatalog({
  products, brands,
}: { products: AdminProductRow[]; brands: { id: number; name: string }[] }) {
  const { busy, error, call } = useAdminCall();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter && p.catSlug !== catFilter) return false;
      if (brandFilter && p.brand !== brandFilter) return false;
      if (needle && !(`${p.sku} ${p.name} ${p.sub}`.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [products, q, catFilter, brandFilter]);

  const filtersActive = q.trim() !== "" || catFilter !== "" || brandFilter !== "";
  const clearFilters = () => { setQ(""); setCatFilter(""); setBrandFilter(""); };

  const allSkus = useMemo(() => filtered.map((p) => p.sku), [filtered]);
  const allSelected = sel.size > 0 && allSkus.every((sku) => sel.has(sku)) && sel.size === allSkus.length;

  const toggle = (sku: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });

  const toggleAll = () =>
    setSel((prev) => (allSelected ? new Set() : new Set(allSkus)));

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
      {/* search + filter bar — instant, client-side over the already-fetched list */}
      <div className="mb-3.5 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className={labelCls} htmlFor="pf-search">Search</label>
          <input
            id="pf-search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="SKU, name or subcategory…" className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-cat-filter">Category</label>
          <select
            id="pf-cat-filter" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className={`${inputCls} w-44`}
          >
            <option value="">All categories</option>
            {ADMIN_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-brand-filter">Brand</label>
          <select
            id="pf-brand-filter" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
            className={`${inputCls} w-40`}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        {filtersActive && (
          <button
            onClick={clearFilters}
            className="h-10 font-mono text-[10px] uppercase tracking-wide text-n600 hover:text-ink"
          >
            clear filters
          </button>
        )}
      </div>
      <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-n400">
        showing <span className="num">{filtered.length}</span> of <span className="num">{products.length}</span> products
      </p>

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

      {filtered.length === 0 ? (
        <div className="rounded-[2px] border border-n200 bg-chalk p-6 text-center text-sm text-n600">
          No products match these filters.
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto rounded-[2px] border border-n200 bg-chalk" style={{ maxHeight: 620 }}>
          <table className="w-full border-collapse text-sm" style={{ minWidth: 2260 }}>
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
                    aria-label="Select all filtered products"
                    className="h-3.5 w-3.5 accent-ember-deep align-middle"
                  />
                </th>
                <th className={`${thCls} text-right`}>Sr. No.</th>
                {["SKU", "Product", "Group", "HSN", "GST %", "Category", "Sub", "Brand", "Supplier code", "MSP"].map((h) => (
                  <th key={h} className={thCls}>{h}</th>
                ))}
                <th className={`${thCls} text-right`}>Std price</th>
                {["Color", "Size", "Stock", "Photography", "Active", "Edit"].map((h) => (
                  <th key={h} className={thCls}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
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
                    <td className={`${tdCls} num text-right text-n600`}>{i + 1}</td>
                    <td className={`${tdCls} font-mono text-[12.5px] text-ink`}>{p.sku}</td>
                    <td className={tdCls}>
                      {p.name}
                      {p.configurable && (
                        <span className="ml-2 font-mono text-[9px] uppercase tracking-wide text-n400">config</span>
                      )}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap font-mono text-[12px] text-ink`}>
                      {p.groupKey ?? <span className="text-n400">—</span>}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap font-mono text-[12px] text-ink`}>
                      {p.hsn ?? <span className="text-n400">—</span>}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap num text-[12px] text-n600`}>
                      {p.gstPercent !== null ? `${p.gstPercent}%` : <span className="text-n400">—</span>}
                    </td>
                    <td className={tdCls}>{catLabel(p.catSlug)}</td>
                    <td className={tdCls}>{p.sub}</td>
                    <td className={tdCls}>{p.brand ?? <span className="text-n400">—</span>}</td>
                    <td className={`${tdCls} whitespace-nowrap font-mono text-[12px] text-ink`}>
                      {p.supplierCode ?? <span className="text-n400">—</span>}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap num text-[12px] text-ink`}>
                      {p.msp !== null ? inr(p.msp) : <span className="text-n400">—</span>}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap num text-right`}>{inr(p.std)}</td>
                    <td className={`${tdCls} whitespace-nowrap text-[12px] text-ink`}>
                      {p.color ?? <span className="text-n400">—</span>}
                    </td>
                    <td className={`${tdCls} whitespace-nowrap text-[12px] text-ink`}>
                      {p.size ?? <span className="text-n400">—</span>}
                    </td>
                    <td className={tdCls}><InStockToggle sku={p.sku} inStock={p.inStock} /></td>
                    <td className={tdCls}><ProductThumbnail img={p.img} /></td>
                    <td className={tdCls}><ActiveToggle sku={p.sku} active={p.active} /></td>
                    <td className={tdCls}><EditProductButton product={p} brands={brands} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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

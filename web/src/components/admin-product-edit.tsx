"use client";

import { useMemo, useState } from "react";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { ADMIN_CATEGORIES, AuditNote, btnEmberSm, btnGhostSm, inputCls, labelCls } from "@/components/admin-ui";
import { ImagePathField, isImgPathPlausible } from "@/components/admin-image-field";
import { Modal } from "@/components/modal";
import { resolveToPaise, type PriceMode } from "@/lib/pricing-calc";
import { inr } from "@/lib/format";
import type { AdminProductRow } from "@/lib/admin-types";

/* ============================================================
   Full-row "Edit" action for the Products table (ADR-0015) — every
   field the table shows as a column, consolidated into one form/one
   save, instead of the per-cell inline edits scattered across
   columns. Backs the post-import cleanup workflow: admin bulk-
   imports a supplier stock sheet, then opens each row here to fill
   in whatever was missing (image, category, brand, HSN/GST, MSP,
   colour, size, stock, group key, margin) without hunting across
   many small cells.

   Group key (ADR-0016) is how a bulk-imported colour/size variant
   gets linked into one buyer-facing listing instead of showing as
   N duplicate products — see server/pricing.ts / server/catalog.ts.

   MRP and Dealer/Purchase price stay creation-only (ADR-0011) — read-
   only context here. Margin mode/value ARE editable (ADR-0017
   amendment): a batch import applies one placeholder margin across
   many genuinely different products, so admin needs to correct it
   per row afterward. Editing margin recomputes the standard price
   from the product's EXISTING dealer price — the dealer price itself
   is not changed here. The margin section only appears for products
   that have a dealer price on record (cost-based entry); a legacy
   product with none keeps the plain direct `std` override only.
   ============================================================ */

export function EditProductButton({
  product, brands,
}: { product: AdminProductRow; brands: { id: number; name: string }[] }) {
  const { busy, error, call, setError } = useAdminCall();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(product.name);
  const [catSlug, setCatSlug] = useState(product.catSlug);
  const [sub, setSub] = useState(product.sub);
  const [meta, setMeta] = useState(product.meta);
  const [brandId, setBrandId] = useState(product.brandId !== null ? String(product.brandId) : "");
  const [img, setImg] = useState(product.img ?? "");
  const [std, setStd] = useState(String(product.std));
  const [hsn, setHsn] = useState(product.hsn ?? "");
  const [gstPercent, setGstPercent] = useState(product.gstPercent !== null ? String(product.gstPercent) : "");
  const [supplierCode, setSupplierCode] = useState(product.supplierCode ?? "");
  const [msp, setMsp] = useState(product.msp !== null ? String(product.msp) : "");
  const [color, setColor] = useState(product.color ?? "");
  const [size, setSize] = useState(product.size ?? "");
  const [groupKey, setGroupKey] = useState(product.groupKey ?? "");
  const [inStock, setInStock] = useState(product.inStock);
  const [active, setActive] = useState(product.active);
  const hasDealerPrice = product.purchase !== null;
  const [marginMode, setMarginMode] = useState<PriceMode>(product.marginMode ?? "percent");
  const [marginValue, setMarginValue] = useState(product.marginValue !== null ? String(product.marginValue) : "");

  const openEdit = () => {
    setName(product.name);
    setCatSlug(product.catSlug);
    setSub(product.sub);
    setMeta(product.meta);
    setBrandId(product.brandId !== null ? String(product.brandId) : "");
    setImg(product.img ?? "");
    setStd(String(product.std));
    setHsn(product.hsn ?? "");
    setGstPercent(product.gstPercent !== null ? String(product.gstPercent) : "");
    setSupplierCode(product.supplierCode ?? "");
    setMsp(product.msp !== null ? String(product.msp) : "");
    setColor(product.color ?? "");
    setSize(product.size ?? "");
    setGroupKey(product.groupKey ?? "");
    setMarginMode(product.marginMode ?? "percent");
    setMarginValue(product.marginValue !== null ? String(product.marginValue) : "");
    setInStock(product.inStock);
    setActive(product.active);
    setError(null);
    setOpen(true);
  };
  const close = () => setOpen(false);

  const nameTrimmed = name.trim();
  const subTrimmed = sub.trim();
  const metaTrimmed = meta.trim();
  const imgTrimmed = img.trim();
  const imgValid = isImgPathPlausible(img);
  const stdNum = parseFloat(std);
  const stdValid = Number.isFinite(stdNum) && stdNum > 0;
  const hsnTrimmed = hsn.trim();
  const hsnValid = hsnTrimmed === "" || /^\d{4,8}$/.test(hsnTrimmed);
  const gstTrimmed = gstPercent.trim();
  const gstNum = parseFloat(gstTrimmed);
  const gstValid = gstTrimmed === "" || (Number.isFinite(gstNum) && gstNum >= 0 && gstNum <= 100);
  const supplierCodeTrimmed = supplierCode.trim();
  const colorTrimmed = color.trim();
  const sizeTrimmed = size.trim();
  const mspTrimmed = msp.trim();
  const mspNum = parseFloat(mspTrimmed);
  const mspValid = mspTrimmed === "" || (Number.isFinite(mspNum) && mspNum > 0);
  const groupKeyTrimmed = groupKey.trim();
  const marginTrimmed = marginValue.trim();
  const marginNum = parseFloat(marginTrimmed);
  const marginValid = !hasDealerPrice || (marginTrimmed !== "" && Number.isFinite(marginNum) && marginNum >= 0);

  const previewStd = useMemo(() => {
    if (!hasDealerPrice || product.purchase === null || !Number.isFinite(marginNum) || marginNum < 0) return null;
    const purchasePaise = Math.round(product.purchase * 100);
    const marginPaise = resolveToPaise(marginMode, marginNum, purchasePaise);
    return (purchasePaise + marginPaise) / 100;
  }, [hasDealerPrice, product.purchase, marginMode, marginNum]);

  const canSave =
    nameTrimmed.length > 0 && subTrimmed.length > 0 && imgValid && stdValid &&
    hsnValid && gstValid && mspValid && marginValid && !busy;

  const save = async () => {
    if (!canSave) return;
    if (
      await call(`/api/admin/products/${encodeURIComponent(product.sku)}`, {
        method: "PATCH",
        body: {
          name: nameTrimmed, catSlug, sub: subTrimmed, meta: metaTrimmed,
          brandId: brandId ? Number(brandId) : null,
          img: imgTrimmed || null,
          std: stdNum,
          hsn: hsnTrimmed || null,
          gstPercent: gstTrimmed === "" ? null : gstNum,
          supplierCode: supplierCodeTrimmed || null,
          msp: mspTrimmed === "" ? null : mspNum,
          color: colorTrimmed || null,
          size: sizeTrimmed || null,
          groupKey: groupKeyTrimmed || null,
          inStock, active,
          ...(hasDealerPrice ? { marginMode, marginValue: marginNum } : {}),
        },
        done: `${product.sku} updated.`,
      })
    ) {
      close();
    }
  };

  return (
    <>
      <button
        onClick={openEdit}
        aria-label={`Edit ${product.sku}`}
        className="font-mono text-[10px] uppercase tracking-wide text-n600 underline-offset-2 hover:text-ink hover:underline"
      >
        edit
      </button>
      <Modal open={open} onClose={close} label={`Edit product — ${product.sku}`} maxWidth="820px">
        <div className="rounded-[2px] border border-n200 bg-chalk p-4">
          <p className="mb-1 font-display text-base font-semibold text-ink">Edit product</p>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-wide text-n600">{product.sku}</p>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="ep-name">Product name</label>
              <input id="ep-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ep-cat">Category</label>
              <select id="ep-cat" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} className={inputCls}>
                {ADMIN_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="ep-sub">Subcategory</label>
              <input id="ep-sub" type="text" value={sub} onChange={(e) => setSub(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ep-brand">Brand</label>
              <select id="ep-brand" value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputCls}>
                <option value="">No brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="ep-meta">Meta line</label>
              <input id="ep-meta" type="text" value={meta} onChange={(e) => setMeta(e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <ImagePathField value={img} onChange={setImg} catSlug={catSlug} idPrefix="ep-img" />
            </div>
            {!hasDealerPrice && (
              <div>
                <label className={labelCls} htmlFor="ep-std">Standard (visitor) price, ₹</label>
                <input
                  id="ep-std" type="number" min={0.01} step="0.01" value={std}
                  onChange={(e) => setStd(e.target.value)} className={`${inputCls} num`}
                />
                {!stdValid && <p className="mt-1 text-xs font-medium text-warn">Must be a positive amount.</p>}
              </div>
            )}
            <div>
              <label className={labelCls} htmlFor="ep-hsn">HSN code</label>
              <input
                id="ep-hsn" type="text" inputMode="numeric" value={hsn}
                onChange={(e) => setHsn(e.target.value)} placeholder="e.g. 950630" className={`${inputCls} num`}
              />
              {!hsnValid && <p className="mt-1 text-xs font-medium text-warn">4 to 8 digits.</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="ep-gst">GST %</label>
              <input
                id="ep-gst" type="number" min={0} max={100} step="0.01" value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)} placeholder="e.g. 18" className={`${inputCls} num`}
              />
              {!gstValid && <p className="mt-1 text-xs font-medium text-warn">0 to 100.</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="ep-supplier-code">Supplier item code</label>
              <input
                id="ep-supplier-code" type="text" value={supplierCode}
                onChange={(e) => setSupplierCode(e.target.value)} placeholder="e.g. AYPU021-3" className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="ep-msp">MSP, ₹</label>
              <input
                id="ep-msp" type="number" min={0.01} step="0.01" value={msp}
                onChange={(e) => setMsp(e.target.value)} placeholder="e.g. 18990.00" className={`${inputCls} num`}
              />
              {!mspValid && <p className="mt-1 text-xs font-medium text-warn">Must be a positive amount.</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="ep-color">Color</label>
              <input
                id="ep-color" type="text" value={color}
                onChange={(e) => setColor(e.target.value)} placeholder="e.g. Green/Purple" className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="ep-size">Size</label>
              <input
                id="ep-size" type="text" value={size}
                onChange={(e) => setSize(e.target.value)} placeholder="e.g. UK 9, L, 4U" className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="ep-group-key">Group key</label>
              <input
                id="ep-group-key" type="text" value={groupKey}
                onChange={(e) => setGroupKey(e.target.value)}
                placeholder="e.g. AYTV079 — leave blank for a standalone product" className={`${inputCls} font-mono`}
              />
              <p className="mt-1 text-xs text-n600">
                ADR-0016: products sharing the same group key show as one catalogue card/product
                page with a Size/Colour picker. Leave blank to keep this a standalone listing.
              </p>
            </div>
          </div>

          {hasDealerPrice && (
            <div className="mt-4 border-t border-n200 pt-4">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-n600">
                ProSmash margin (ADR-0017)
              </p>
              <div className="grid gap-3.5 sm:grid-cols-4">
                <div>
                  <span className={labelCls}>MRP</span>
                  <p className="num h-10 flex items-center text-sm text-n600">
                    {product.mrp !== null ? inr(product.mrp) : "—"}
                  </p>
                </div>
                <div>
                  <span className={labelCls}>Dealer price</span>
                  <p className="num h-10 flex items-center text-sm text-n600">{inr(product.purchase!)}</p>
                </div>
                <div>
                  <label className={labelCls} htmlFor="ep-margin">Margin</label>
                  <div className="flex items-center gap-1.5">
                    <div className="inline-flex h-10 shrink-0 rounded-[2px] border border-n400 bg-chalk">
                      {(["percent", "fixed"] as const).map((m) => (
                        <button
                          key={m} type="button" onClick={() => setMarginMode(m)} aria-pressed={marginMode === m}
                          className={"h-full px-2.5 text-[12px] font-semibold " + (marginMode === m ? "bg-ember-deep text-white" : "text-n600")}
                        >
                          {m === "percent" ? "%" : "₹"}
                        </button>
                      ))}
                    </div>
                    <input
                      id="ep-margin" type="number" min={0} step="0.01" value={marginValue}
                      onChange={(e) => setMarginValue(e.target.value)} className={`${inputCls} num`}
                    />
                  </div>
                  {!marginValid && <p className="mt-1 text-xs font-medium text-warn">Required — a non-negative number.</p>}
                </div>
                <div>
                  <span className={labelCls}>Resulting visitor price</span>
                  <p className="num h-10 flex items-center text-sm font-semibold text-ember-deep">
                    {previewStd !== null ? inr(previewStd) : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-n600">
                Margin is applied over Dealer Price (OBD-23) — the same rule as the Add Product
                form. Changing it recomputes the standard price above; Dealer Price/MRP are not
                editable here (ADR-0011).
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)}
                className="h-3.5 w-3.5 accent-ember-deep"
              />
              In stock
            </label>
            <label className="inline-flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}
                className="h-3.5 w-3.5 accent-ember-deep"
              />
              Active (visible in catalogue)
            </label>
          </div>

          {!hasDealerPrice && (
            <p className="mt-3 text-xs text-n600">
              This product predates cost-based pricing entry (no dealer price on record) — only
              the standard price can be overridden directly.
            </p>
          )}

          <ActionError error={error} />
          <div className="mt-4 flex gap-2.5">
            <button onClick={() => void save()} disabled={!canSave} className={btnEmberSm}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button onClick={close} disabled={busy} className={btnGhostSm}>
              Cancel
            </button>
          </div>
          <AuditNote />
        </div>
      </Modal>
    </>
  );
}

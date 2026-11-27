"use client";

import { useMemo, useState } from "react";
import { NoteFlag, Panel, PanelHead } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { ADMIN_CATEGORIES, AuditNote, btnEmber, inputCls, labelCls } from "@/components/admin-ui";
import { isImgPathPlausible } from "@/components/admin-image-field";
import { ProductImagesField } from "@/components/admin-product-images-field";
import { resolveToPaise, visitorDiscountPct, type PriceMode } from "@/lib/pricing-calc";
import { normalizeSku } from "@/lib/product-catalog-fields";
import { inr } from "@/lib/format";

/* ============================================================
   Add product to the master catalogue. Dealer/purchase price and
   ProSmash margin are each entered as a % of MRP or a fixed ₹
   amount; the visitor selling price (= purchase + margin) and the
   visitor discount off MRP are resolved live for preview here and
   independently recomputed server-side at save time (never trust
   a client-submitted total). Approved-buyer pricing is a separate
   per-buyer-category discount off the resolved selling price — see
   the Pricing page — and is untouched by this form.

   Image has three paths, all writing the same `img` field: (1)
   "Upload from device" — real upload to DigitalOcean Spaces (ADR-0013,
   server/storage.ts), admin-trusted at the moment of upload, not a
   second approval step; (2) "Browse library" — read-only picker over
   files already committed under public/img/<category>/ by the
   photography programme (server/media.ts); (3) typing a known
   /img/... path directly. Server-side `assertImgPath` in
   server/admin.ts is the actual authority — it accepts only an
   /img/... path or a URL on this app's own configured upload host,
   never an arbitrary external URL.

   HSN Code / GST % (ADR-0014) are optional, admin-entered
   record-keeping fields only — manually typed, never auto-assigned,
   format/range-checked server-side but not validated against any
   tax classification authority. They are NOT read by the pricing
   preview above or by checkout/invoices — wiring GST into those
   calculations stays pending OBD-11/OBD-20 professional tax
   validation.

   Supplier code / MSP / colour / size / in-stock (ADR-0015) support
   importing rows from a supplier stock sheet (e.g. LI-NING, HUNDRED)
   without inventing a variant model: each colour/size combination
   from a sheet becomes its own ProSmash product row, with the
   original vendor item code kept for traceability. MSP is a third
   reference price some sheets carry — stored, not computed into the
   pricing preview above. `inStock` is deliberately separate from
   `active`: active controls catalogue visibility, inStock flags
   temporary unavailability of a still-listed product.

   Group key (ADR-0016): an optional, admin-typed key. Leave it blank
   for a standalone product (unchanged behaviour). Type the SAME key
   on two or more products — e.g. a shoe's different colours/sizes —
   and the buyer-facing catalogue shows them as ONE card/product page
   with a Size/Colour picker, resolving to whichever SKU a buyer
   actually orders; each still has its own price/stock/HSN/GST.
   ============================================================ */

function ModeToggle({
  value, onChange, idPrefix,
}: { value: PriceMode; onChange: (m: PriceMode) => void; idPrefix: string }) {
  return (
    <div className="inline-flex h-9 rounded-[2px] border border-n400 bg-chalk" role="group" aria-label="Entry mode">
      {(["percent", "fixed"] as const).map((m) => (
        <button
          key={m}
          id={`${idPrefix}-${m}`}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={value === m}
          className={
            "h-full px-3 text-[13px] font-semibold transition-colors " +
            (value === m ? "bg-ember-deep text-white" : "text-n600 hover:text-ink")
          }
        >
          {m === "percent" ? "% of MRP" : "₹ Fixed"}
        </button>
      ))}
    </div>
  );
}

export function ProductForm({
  brands, onSuccess,
}: {
  brands: { id: number; name: string }[];
  /** fires after a successful add — e.g. closing the surrounding modal */
  onSuccess?: () => void;
}) {
  const { busy, error, call } = useAdminCall();
  const [form, setForm] = useState({
    sku: "", name: "", catSlug: "cricket", sub: "", meta: "", mrp: "",
  });
  const [brandId, setBrandId] = useState("");
  const [img, setImg] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [purchaseMode, setPurchaseMode] = useState<PriceMode>("percent");
  const [purchaseValue, setPurchaseValue] = useState("");
  const [marginMode, setMarginMode] = useState<PriceMode>("percent");
  const [marginValue, setMarginValue] = useState("");
  const [hsn, setHsn] = useState("");
  const [gstPercent, setGstPercent] = useState("");
  const [supplierCode, setSupplierCode] = useState("");
  const [msp, setMsp] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [groupKey, setGroupKey] = useState("");
  const [inStock, setInStock] = useState(true);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const normalizedSku = useMemo(() => {
    try { return normalizeSku(form.sku); } catch { return null; }
  }, [form.sku]);
  const imgTrimmed = img.trim();
  const imgValid = isImgPathPlausible(img);
  const mrp = parseFloat(form.mrp);
  const purchaseNum = parseFloat(purchaseValue);
  const marginNum = parseFloat(marginValue);
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

  const preview = useMemo(() => {
    if (!Number.isFinite(mrp) || mrp <= 0) return null;
    const mrpPaise = Math.round(mrp * 100);
    const purchasePaise = resolveToPaise(purchaseMode, Number.isFinite(purchaseNum) ? purchaseNum : 0, mrpPaise);
    // margin % is of Dealer/Purchase price, not MRP (OBD-23 amendment, 2026-11-20)
    const marginPaise = resolveToPaise(marginMode, Number.isFinite(marginNum) ? marginNum : 0, purchasePaise);
    const visitorPaise = purchasePaise + marginPaise;
    return {
      mrpPaise, purchasePaise, marginPaise, visitorPaise,
      discountPct: visitorDiscountPct(mrpPaise, visitorPaise),
    };
  }, [mrp, purchaseMode, purchaseNum, marginMode, marginNum]);

  const canSubmit =
    !!normalizedSku && form.name.trim().length > 0 && form.sub.trim().length > 0 &&
    imgValid &&
    Number.isFinite(mrp) && mrp > 0 &&
    Number.isFinite(purchaseNum) && purchaseNum >= 0 &&
    Number.isFinite(marginNum) && marginNum >= 0 &&
    hsnValid && gstValid && mspValid &&
    !!preview && preview.visitorPaise > 0 && !busy;

  const submit = async () => {
    if (!canSubmit || !normalizedSku) return;
    const sku = normalizedSku;
    if (
      await call("/api/admin/products", {
        body: {
          sku,
          name: form.name.trim(),
          catSlug: form.catSlug,
          sub: form.sub.trim(),
          meta: form.meta.trim() || undefined,
          mrp,
          purchaseMode, purchaseValue: purchaseNum,
          marginMode, marginValue: marginNum,
          brandId: brandId ? Number(brandId) : null,
          img: imgTrimmed || null,
          gallery: gallery.map((g) => g.trim()).filter(Boolean),
          hsn: hsnTrimmed || null,
          gstPercent: gstTrimmed === "" ? null : gstNum,
          supplierCode: supplierCodeTrimmed || null,
          msp: mspTrimmed === "" ? null : mspNum,
          color: colorTrimmed || null,
          size: sizeTrimmed || null,
          inStock,
          groupKey: groupKeyTrimmed || null,
        },
        done: `${sku} added to the catalogue.`,
      })
    ) {
      setForm({ sku: "", name: "", catSlug: form.catSlug, sub: "", meta: "", mrp: "" });
      setPurchaseValue("");
      setMarginValue("");
      setImg("");
      setGallery([]);
      setHsn("");
      setGstPercent("");
      setSupplierCode("");
      setMsp("");
      setColor("");
      setSize("");
      setGroupKey("");
      setInStock(true);
      onSuccess?.();
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
              placeholder="e.g. CR1200 or 3455" className={`${inputCls} font-mono uppercase`} />
            <p className="mt-1 text-xs text-n600">
              {normalizedSku
                ? <>Will be saved as <span className="font-mono font-semibold text-ink">{normalizedSku}</span></>
                : "Free entry — letters+digits, or digits alone; case and a hyphen are optional."}
            </p>
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
            <label className={labelCls} htmlFor="pf-brand">Brand</label>
            <select id="pf-brand" value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputCls}>
              <option value="">No brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {brands.length === 0 && (
              <p className="mt-1 text-xs text-n600">
                No brands yet — add one on the Brands page first.
              </p>
            )}
          </div>
          <div>
            <label className={labelCls} htmlFor="pf-meta">Meta line</label>
            <input id="pf-meta" type="text" value={form.meta} onChange={set("meta")}
              placeholder="e.g. Alum-tanned leather · BCCI match grade" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <ProductImagesField
              img={img} onImgChange={setImg}
              gallery={gallery} onGalleryChange={setGallery}
              catSlug={form.catSlug} idPrefix="pf"
            />
          </div>
        </div>

        <div className="mt-5 border-t border-n200 pt-4">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-n600">Cost-based pricing</p>

          <div>
            <label className={labelCls} htmlFor="pf-mrp">MRP — cut-off price, ₹ (required)</label>
            <input id="pf-mrp" type="number" min={0.01} step="0.01" value={form.mrp} onChange={set("mrp")}
              className={`${inputCls} num max-w-xs`} />
            <p className="mt-1 text-xs text-n600">
              The printed/listed cut-off price — shown struck through against the visitor selling price.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="pf-purchase">Dealer / purchase price (required)</label>
              <div className="flex flex-wrap items-center gap-2">
                <ModeToggle value={purchaseMode} onChange={setPurchaseMode} idPrefix="pf-purchase-mode" />
                <input
                  id="pf-purchase" type="number" min={0} step="0.01"
                  value={purchaseValue} onChange={(e) => setPurchaseValue(e.target.value)}
                  placeholder={purchaseMode === "percent" ? "e.g. 65" : "e.g. 2500.00"}
                  className={`${inputCls} num w-32`}
                />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="pf-margin">ProSmash margin (required)</label>
              <div className="flex flex-wrap items-center gap-2">
                <ModeToggle value={marginMode} onChange={setMarginMode} idPrefix="pf-margin-mode" />
                <input
                  id="pf-margin" type="number" min={0} step="0.01"
                  value={marginValue} onChange={(e) => setMarginValue(e.target.value)}
                  placeholder={marginMode === "percent" ? "e.g. 10" : "e.g. 400.00"}
                  className={`${inputCls} num w-32`}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[2px] border border-n200 bg-n100 p-3.5">
            <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wide text-n600">
              Live pricing preview — admin-only, never shown to visitors or buyers
            </p>
            {preview ? (
              <dl className="grid grid-cols-2 gap-y-1.5 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-n600">Purchase price</dt>
                  <dd className="num font-semibold text-ink">{inr(preview.purchasePaise / 100)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-n600">Margin amount</dt>
                  <dd className="num font-semibold text-ink">{inr(preview.marginPaise / 100)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-n600">Visitor selling price</dt>
                  <dd className="num font-semibold text-ember-deep">{inr(preview.visitorPaise / 100)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-n600">MRP (cut-off)</dt>
                  <dd className="num font-semibold text-n600 line-through">{inr(preview.mrpPaise / 100)}</dd>
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <dt className="text-xs text-n600">Visitor discount</dt>
                  <dd className="num font-semibold text-ok">{preview.discountPct}% off MRP</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-n600">Enter an MRP to see the resolved pricing.</p>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-n200 pt-4">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-n600">
            Tax reference (optional)
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="pf-hsn">HSN code</label>
              <input
                id="pf-hsn" type="text" inputMode="numeric" value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                placeholder="e.g. 950630" className={`${inputCls} num max-w-xs`}
              />
              {!hsnValid && (
                <p className="mt-1 text-xs font-medium text-warn">4 to 8 digits.</p>
              )}
            </div>
            <div>
              <label className={labelCls} htmlFor="pf-gst">GST %</label>
              <input
                id="pf-gst" type="number" min={0} max={100} step="0.01" value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
                placeholder="e.g. 18" className={`${inputCls} num max-w-xs`}
              />
              {!gstValid && (
                <p className="mt-1 text-xs font-medium text-warn">0 to 100.</p>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-n600">
            Record-keeping only — admin-entered, not auto-assigned. Not used in the pricing
            preview above or in checkout/invoices yet (pending OBD-11/OBD-20 tax validation).
          </p>
        </div>

        <div className="mt-5 border-t border-n200 pt-4">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-n600">
            Supplier reference (optional)
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="pf-supplier-code">Supplier item code</label>
              <input
                id="pf-supplier-code" type="text" value={supplierCode}
                onChange={(e) => setSupplierCode(e.target.value)}
                placeholder="e.g. AYPU021-3" className={`${inputCls} font-mono max-w-xs`}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="pf-msp">MSP, ₹</label>
              <input
                id="pf-msp" type="number" min={0.01} step="0.01" value={msp}
                onChange={(e) => setMsp(e.target.value)}
                placeholder="e.g. 18990.00" className={`${inputCls} num max-w-xs`}
              />
              {!mspValid && (
                <p className="mt-1 text-xs font-medium text-warn">Must be a positive amount.</p>
              )}
            </div>
            <div>
              <label className={labelCls} htmlFor="pf-color">Color</label>
              <input
                id="pf-color" type="text" value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Green/Purple" className={`${inputCls} max-w-xs`}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="pf-size">Size</label>
              <input
                id="pf-size" type="text" value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. UK 9, L, 4U" className={`${inputCls} max-w-xs`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="pf-group-key">Group key</label>
              <input
                id="pf-group-key" type="text" value={groupKey}
                onChange={(e) => setGroupKey(e.target.value)}
                placeholder="e.g. AYTV079 — leave blank for a standalone product" className={`${inputCls} font-mono max-w-sm`}
              />
            </div>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox" checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="h-3.5 w-3.5 accent-ember-deep"
            />
            In stock
          </label>
          <p className="mt-2 text-xs text-n600">
            Supplier item code / MSP are record-keeping fields for importing supplier stock
            sheets. Color / size / group key work together (ADR-0016): type the SAME group key
            on two or more products (e.g. a shoe&apos;s colours/sizes) and the buyer-facing catalogue
            shows them as ONE card/product page with a Size/Colour picker — each still has its
            own price/stock/HSN/GST. Leave group key blank for a standalone product (unchanged
            behaviour). In stock is separate from Active: Active controls catalogue visibility,
            In stock flags temporary unavailability of a still-listed product.
          </p>
        </div>

        <ActionError error={error} />
        <button onClick={() => void submit()} disabled={!canSubmit} className={`${btnEmber} mt-4`}>
          {busy ? "Adding…" : "Add product"}
        </button>
        <NoteFlag className="mt-3">
          approved-buyer pricing is a separate per-buyer-category discount off
          the resolved visitor selling price — set on the Pricing page, unaffected
          by this form (obd-05) · image — upload from device (stored in
          DigitalOcean Spaces, adr-0013), browse the approved library, or type
          a known path; no arbitrary external urls accepted · hsn code / gst %
          are optional admin-entered record-keeping fields (adr-0014) — not
          wired into pricing, checkout or invoices, pending obd-20 / obd-11 +
          tax validation
        </NoteFlag>
        <AuditNote />
      </div>
    </Panel>
  );
}

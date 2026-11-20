"use client";

import { useEffect, useMemo, useState } from "react";
import { NoteFlag, Panel, PanelHead } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { ADMIN_CATEGORIES, AuditNote, btnEmber, inputCls, labelCls } from "@/components/admin-ui";
import { resolveToPaise, visitorDiscountPct, type PriceMode } from "@/lib/pricing-calc";
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

   Photography still arrives only through the approved programme —
   this form never accepts a file upload or an external URL (no
   object storage exists yet, ADR-0005; no placeholder imagery,
   ever). The Image path field only LINKS a product to a photo a
   human has already placed under public/img/ via that programme;
   it is validated server-side to that tree only. "Browse library"
   lists the files already committed under public/img/<category>/
   (read-only — see server/media.ts) so admin can click one instead
   of typing the exact filename. GST rate / HSN fields are
   deliberately absent — pending OBD-20 / OBD-11 and professional
   tax validation.
   ============================================================ */

const SKU_RE = /^[A-Z]{2}-\d{4}$/;
const IMG_RE = /^\/img\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp)$/i;

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

/** Thumbnail grid of files already committed under public/img/<catSlug>/ —
 *  browse-and-pick instead of typing the exact filename. Read-only: never
 *  uploads, never writes; re-fetches whenever the category changes since
 *  the library is scoped per category. */
function LibraryPicker({
  catSlug, onPick, onClose,
}: { catSlug: string; onPick: (path: string) => void; onClose: () => void }) {
  const [images, setImages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setImages(null);
    setError(null);
    fetch(`/api/admin/catalog-images?cat=${encodeURIComponent(catSlug)}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { images?: string[]; error?: string } | null;
        if (cancelled) return;
        if (!res.ok) { setError(data?.error ?? "Couldn't load the library."); return; }
        setImages(data?.images ?? []);
      })
      .catch(() => { if (!cancelled) setError("Couldn't load the library — check your connection."); });
    return () => { cancelled = true; };
  }, [catSlug]);

  return (
    <div className="mt-2.5 rounded-[2px] border border-n200 bg-chalk p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wide text-n600">
          Approved library — {catSlug}
        </p>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-n600 hover:text-ink">
          Close
        </button>
      </div>
      {error ? (
        <p className="text-sm text-bad">{error}</p>
      ) : images === null ? (
        <p className="text-sm text-n600">Loading…</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-n600">
          No approved photos on file for this category yet — the photography programme hasn&rsquo;t placed any under public/img/{catSlug}/.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-8">
          {images.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => onPick(src)}
              title={src}
              className="group aspect-square overflow-hidden rounded-[2px] border border-n200 hover:border-ember-deep"
            >
              <img src={src} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductForm({ brands }: { brands: { id: number; name: string }[] }) {
  const { busy, error, call } = useAdminCall();
  const [form, setForm] = useState({
    sku: "", name: "", catSlug: "cricket", sub: "", meta: "", mrp: "",
  });
  const [brandId, setBrandId] = useState("");
  const [img, setImg] = useState("");
  const [imgError, setImgError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [purchaseMode, setPurchaseMode] = useState<PriceMode>("percent");
  const [purchaseValue, setPurchaseValue] = useState("");
  const [marginMode, setMarginMode] = useState<PriceMode>("percent");
  const [marginValue, setMarginValue] = useState("");

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const sku = form.sku.trim().toUpperCase();
  const imgTrimmed = img.trim();
  const imgValid = imgTrimmed === "" || IMG_RE.test(imgTrimmed);
  const mrp = parseFloat(form.mrp);
  const purchaseNum = parseFloat(purchaseValue);
  const marginNum = parseFloat(marginValue);

  const preview = useMemo(() => {
    if (!Number.isFinite(mrp) || mrp <= 0) return null;
    const mrpPaise = Math.round(mrp * 100);
    const purchasePaise = resolveToPaise(purchaseMode, Number.isFinite(purchaseNum) ? purchaseNum : 0, mrpPaise);
    const marginPaise = resolveToPaise(marginMode, Number.isFinite(marginNum) ? marginNum : 0, mrpPaise);
    const visitorPaise = purchasePaise + marginPaise;
    return {
      mrpPaise, purchasePaise, marginPaise, visitorPaise,
      discountPct: visitorDiscountPct(mrpPaise, visitorPaise),
    };
  }, [mrp, purchaseMode, purchaseNum, marginMode, marginNum]);

  const canSubmit =
    SKU_RE.test(sku) && form.name.trim().length > 0 && form.sub.trim().length > 0 &&
    imgValid &&
    Number.isFinite(mrp) && mrp > 0 &&
    Number.isFinite(purchaseNum) && purchaseNum >= 0 &&
    Number.isFinite(marginNum) && marginNum >= 0 &&
    !!preview && preview.visitorPaise > 0 && !busy;

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
          mrp,
          purchaseMode, purchaseValue: purchaseNum,
          marginMode, marginValue: marginNum,
          brandId: brandId ? Number(brandId) : null,
          img: imgTrimmed || null,
        },
        done: `${sku} added to the catalogue.`,
      })
    ) {
      setForm({ sku: "", name: "", catSlug: form.catSlug, sub: "", meta: "", mrp: "" });
      setPurchaseValue("");
      setMarginValue("");
      setImg("");
      setImgError(false);
      setPickerOpen(false);
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
            <div className="flex items-center justify-between">
              <label className={labelCls} htmlFor="pf-img">Image path</label>
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="mb-1.5 text-xs font-semibold text-ember-deep hover:underline"
              >
                {pickerOpen ? "Hide library" : "Browse library…"}
              </button>
            </div>
            <div className="flex items-start gap-3">
              <input
                id="pf-img" type="text" value={img}
                onChange={(e) => { setImg(e.target.value); setImgError(false); }}
                placeholder="/img/cricket/new-bat-hero.jpg"
                className={`${inputCls} font-mono text-[12.5px]`}
              />
              {imgTrimmed && IMG_RE.test(imgTrimmed) && (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[2px] border border-n200 bg-n100">
                  {/* plain img, not next/image — admin-entered path, checked live via onError */}
                  <img
                    src={imgTrimmed}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                    onLoad={() => setImgError(false)}
                  />
                </div>
              )}
            </div>
            {imgTrimmed && !IMG_RE.test(imgTrimmed) ? (
              <p className="mt-1 text-xs font-medium text-bad">
                Must look like /img/category/file-name.jpg — a path under this app&rsquo;s own approved-photography tree, not an upload or external URL.
              </p>
            ) : imgTrimmed && imgError ? (
              <p className="mt-1 text-xs font-medium text-bad">
                No file found at this path — confirm the photography programme has placed it under public/img/ first.
              </p>
            ) : (
              <p className="mt-1 text-xs text-n600">
                Links an already-approved photo already placed under public/img/ by the photography programme —
                this does not upload a file. Leave blank if none exists yet; the product shows the placeholder hatch instead.
              </p>
            )}
            {pickerOpen && (
              <LibraryPicker
                catSlug={form.catSlug}
                onClose={() => setPickerOpen(false)}
                onPick={(path) => { setImg(path); setImgError(false); setPickerOpen(false); }}
              />
            )}
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

        <ActionError error={error} />
        <button onClick={() => void submit()} disabled={!canSubmit} className={`${btnEmber} mt-4`}>
          {busy ? "Adding…" : "Add product"}
        </button>
        <NoteFlag className="mt-3">
          approved-buyer pricing is a separate per-buyer-category discount off
          the resolved visitor selling price — set on the Pricing page, unaffected
          by this form (obd-05) · image path only links an already-approved file
          already placed under public/img/ — browse library lists what&rsquo;s on
          file for the selected category, no upload, no external urls, no
          placeholder imagery · gst rate / hsn fields absent, pending obd-20 /
          obd-11 + tax validation
        </NoteFlag>
        <AuditNote />
      </div>
    </Panel>
  );
}

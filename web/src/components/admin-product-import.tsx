"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionError } from "@/components/admin-actions";
import {
  ADMIN_CATEGORIES, btnEmber, btnEmberSm, btnGhostSm, inputCls, labelCls, tdCls, thCls, trCls,
} from "@/components/admin-ui";
import { Modal } from "@/components/modal";
import { inr } from "@/lib/format";
import type { PriceMode } from "@/lib/pricing-calc";

/* ============================================================
   ADR-0017 — bulk-import a supplier stock sheet (.xlsx). Two-step
   flow, never a blind insert:
     1. Upload + "Analyse" — server parses the file (ExcelJS +
        lib/excel-import-mapping.ts) and returns a PREVIEW only; no
        DB write happens here. Candidate SKUs, parsed MRP/dealer/MSP/
        GST/colour/size/stock, a per-row groupKey, and a best-effort
        suggestedSub (rackets/shoes/bags/apparel…, detectSubcategory)
        are all shown for review before anything is committed — the
        subcategory guess is editable per displayed row.
     2. Batch config (category/brand/margin apply to the whole batch;
        the default subcategory only fills rows with no suggestion)
        + "Import" — commits via bulkImportProducts(). Rows missing
        required pricing are automatically excluded and reported, not
        silently guessed. Imports as inactive by default (admin
        reviews pricing before publishing) unless "Activate
        immediately" is checked.
   ============================================================ */

interface PreviewRow {
  supplierCode: string;
  groupKey: string;
  name: string;
  color: string | null;
  size: string | null;
  mrp: number | null;
  dealerExGst: number | null;
  msp: number | null;
  gstPercent: number | null;
  inStock: boolean;
  sourceRow: number;
  warnings: string[];
  sku: string;
  importable: boolean;
  /** best-effort per-row subcategory guess (rackets/shoes/bags/apparel…) —
   *  null when the sheet gave no usable signal for this row; admin can
   *  edit the shown rows below, or leave it and fix per-product later. */
  suggestedSub: string | null;
}

interface Preview {
  rows: PreviewRow[];
  skippedBlankRows: number;
  headerNotFound: boolean;
}

const MAX_PREVIEW_ROWS_SHOWN = 300;

export function ImportProductsButton({ brands }: { brands: { id: number; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [skuPrefix, setSkuPrefix] = useState("BD");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeErr, setAnalyzeErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // admin edits to the auto-detected per-row subcategory, keyed by sku —
  // only the displayed (capped) rows are editable here; everything else
  // keeps its auto-detected guess (or falls back to the batch default)
  const [subOverrides, setSubOverrides] = useState<Record<string, string>>({});

  const [catSlug, setCatSlug] = useState("badminton");
  const [sub, setSub] = useState("");
  const [brandId, setBrandId] = useState("");
  const [marginMode, setMarginMode] = useState<PriceMode>("percent");
  const [marginValue, setMarginValue] = useState("");
  const [activate, setActivate] = useState(false);

  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; mergedDuplicates: number; failed: { sku: string; error: string }[] } | null>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setAnalyzeErr(null);
    setResult(null);
    setSub("");
    setBrandId("");
    setMarginValue("");
    setActivate(false);
    setSubOverrides({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const close = () => { setOpen(false); reset(); };

  const analyze = async () => {
    if (!file) return;
    const prefix = skuPrefix.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(prefix)) {
      setAnalyzeErr("SKU prefix must be exactly two letters (e.g. BD).");
      return;
    }
    setAnalyzing(true);
    setAnalyzeErr(null);
    setPreview(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("skuPrefix", prefix);
      const res = await fetch("/api/admin/products/import/preview", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as Preview & { error?: string } | null;
      if (!res.ok || !data) {
        setAnalyzeErr((data as { error?: string } | null)?.error ?? "Could not read this file — please try again.");
        return;
      }
      if (data.headerNotFound) {
        setAnalyzeErr("Couldn't find a recognisable header row (Item Code / MRP / Dealer / MSP) in this file.");
        return;
      }
      setPreview(data);
    } catch {
      setAnalyzeErr("Upload failed — check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const importableRows = preview?.rows.filter((r) => r.importable) ?? [];
  const warningRows = preview?.rows.filter((r) => r.warnings.length > 0) ?? [];
  const notImportableCount = (preview?.rows.length ?? 0) - importableRows.length;
  const autoClassifiedCount = importableRows.filter((r) => r.suggestedSub !== null).length;

  const marginTrimmed = marginValue.trim();
  const marginNum = parseFloat(marginTrimmed);
  // Margin is optional: a real stock sheet rarely has a single correct
  // markup upfront — leave blank and fix per row afterward via the
  // product list's Edit action (margin defaults to 0%, i.e. no markup
  // yet — safe since the batch still imports inactive by default).
  const marginValid = marginTrimmed === "" || (Number.isFinite(marginNum) && marginNum >= 0);
  const canCommit = !!preview && importableRows.length > 0 && marginValid && !committing;

  const commit = async () => {
    if (!canCommit || !preview) return;
    setCommitting(true);
    setCommitError(null);
    try {
      const res = await fetch("/api/admin/products/import/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rows: importableRows.map((r) => ({
            ...r,
            sub: (subOverrides[r.sku] ?? r.suggestedSub ?? "").trim() || undefined,
          })),
          catSlug, sub: sub.trim() || undefined,
          brandId: brandId ? Number(brandId) : null,
          marginMode, marginValue: marginTrimmed === "" ? undefined : marginNum,
          activate,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        { created?: number; mergedDuplicates?: number; failed?: { sku: string; error: string }[]; error?: string } | null;
      if (!res.ok || !data) {
        setCommitError(data?.error ?? "The import could not be completed — please try again.");
        return;
      }
      setResult({ created: data.created ?? 0, mergedDuplicates: data.mergedDuplicates ?? 0, failed: data.failed ?? [] });
      router.refresh();
    } catch {
      setCommitError("The import could not be completed — check your connection and try again.");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={btnGhostSm}>
        Import from Excel
      </button>
      <Modal open={open} onClose={close} label="Import products from Excel" maxWidth="1100px">
        <div className="rounded-[2px] border border-n200 bg-chalk p-4">
          <p className="mb-1 font-display text-base font-semibold text-ink">Import products from Excel</p>
          <p className="mb-4 text-[13px] text-n600">
            Upload a supplier stock sheet (.xlsx) — rows are previewed before anything is saved.
          </p>

          {!result && (
            <div className="grid gap-3.5 sm:grid-cols-[1fr_140px_auto] sm:items-end">
              <div>
                <label className={labelCls} htmlFor="imp-file">Stock sheet (.xlsx)</label>
                <input
                  id="imp-file" type="file" accept=".xlsx"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="imp-prefix">SKU prefix</label>
                <input
                  id="imp-prefix" type="text" value={skuPrefix} maxLength={2}
                  onChange={(e) => setSkuPrefix(e.target.value.toUpperCase())}
                  className={`${inputCls} font-mono uppercase`}
                />
              </div>
              <button onClick={() => void analyze()} disabled={!file || analyzing} className={btnEmberSm}>
                {analyzing ? "Analysing…" : "Analyse file"}
              </button>
            </div>
          )}
          {analyzeErr && <ActionError error={analyzeErr} />}

          {preview && !result && (
            <>
              <div className="mt-4 rounded-[2px] border border-n200 bg-n100 p-3.5 text-[13px]">
                <p>
                  <b className="num text-ink">{preview.rows.length}</b> product rows found ·{" "}
                  <b className="num text-ok">{importableRows.length}</b> ready to import ·{" "}
                  {notImportableCount > 0 && (
                    <><b className="num text-warn">{notImportableCount}</b> missing MRP/dealer price (excluded) · </>
                  )}
                  <b className="num text-n600">{preview.skippedBlankRows}</b> blank spacer rows skipped
                  {warningRows.length > 0 && (
                    <> · <b className="num text-warn">{warningRows.length}</b> have a warning (still importable)</>
                  )}
                  {importableRows.length > 0 && (
                    <> · <b className="num text-ink">{autoClassifiedCount}</b> of {importableRows.length} auto-classified
                    into a subcategory (edit below, or leave the rest on the batch default)</>
                  )}
                </p>
              </div>

              <div className="mt-3 max-h-[320px] overflow-auto rounded-[2px] border border-n200">
                <table className="w-full border-collapse text-sm" style={{ minWidth: 1080 }}>
                  <thead>
                    <tr>
                      {["Row", "SKU", "Supplier code", "Group", "Name", "Color", "Size", "MRP", "Dealer", "MSP", "GST%", "Stock", "Subcategory", "Status"].map((h) => (
                        <th key={h} className={thCls}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, MAX_PREVIEW_ROWS_SHOWN).map((r) => (
                      <tr key={`${r.sku}-${r.sourceRow}`} className={trCls}>
                        <td className={`${tdCls} num text-n600`}>{r.sourceRow}</td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{r.sku}</td>
                        <td className={`${tdCls} font-mono text-[12px]`}>{r.supplierCode}</td>
                        <td className={`${tdCls} font-mono text-[12px] text-n600`}>{r.groupKey}</td>
                        <td className={tdCls}>{r.name}</td>
                        <td className={tdCls}>{r.color ?? <span className="text-n400">—</span>}</td>
                        <td className={tdCls}>{r.size ?? <span className="text-n400">—</span>}</td>
                        <td className={`${tdCls} num text-right`}>{r.mrp !== null ? inr(r.mrp) : "—"}</td>
                        <td className={`${tdCls} num text-right`}>{r.dealerExGst !== null ? inr(r.dealerExGst) : "—"}</td>
                        <td className={`${tdCls} num text-right`}>{r.msp !== null ? inr(r.msp) : "—"}</td>
                        <td className={`${tdCls} num text-right`}>{r.gstPercent ?? "—"}</td>
                        <td className={tdCls}>{r.inStock ? "In stock" : "No stock"}</td>
                        <td className={tdCls}>
                          <input
                            type="text"
                            value={subOverrides[r.sku] ?? r.suggestedSub ?? ""}
                            onChange={(e) => setSubOverrides((prev) => ({ ...prev, [r.sku]: e.target.value }))}
                            placeholder={sub.trim() || "Imported"}
                            className={`${inputCls} h-8 text-[12px]`}
                          />
                        </td>
                        <td className={tdCls}>
                          {!r.importable ? (
                            <span className="text-warn">excluded</span>
                          ) : r.warnings.length > 0 ? (
                            <span className="text-warn" title={r.warnings.join("; ")}>warning</span>
                          ) : (
                            <span className="text-ok">ready</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.rows.length > MAX_PREVIEW_ROWS_SHOWN && (
                  <p className="p-2.5 font-mono text-[10px] uppercase tracking-wide text-n400">
                    showing the first {MAX_PREVIEW_ROWS_SHOWN} of {preview.rows.length} rows — every row above is still part of the import
                  </p>
                )}
              </div>

              <div className="mt-5 border-t border-n200 pt-4">
                <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-n600">
                  Applied to every row in this batch
                </p>
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className={labelCls} htmlFor="imp-cat">Category</label>
                    <select id="imp-cat" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} className={inputCls}>
                      {ADMIN_CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="imp-sub">Default subcategory</label>
                    <input
                      id="imp-sub" type="text" value={sub} onChange={(e) => setSub(e.target.value)}
                      placeholder='e.g. Imported — used only where auto-detect (above) found nothing'
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="imp-brand">Brand</label>
                    <select id="imp-brand" value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputCls}>
                      <option value="">No brand</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="imp-margin">ProSmash margin</label>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex h-10 rounded-[2px] border border-n400 bg-chalk">
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
                        id="imp-margin" type="number" min={0} step="0.01" value={marginValue}
                        onChange={(e) => setMarginValue(e.target.value)}
                        placeholder={marginMode === "percent" ? "blank = 0%" : "blank = ₹0"}
                        className={`${inputCls} num`}
                      />
                    </div>
                    {!marginValid && <p className="mt-1 text-xs font-medium text-warn">Must be a non-negative number.</p>}
                    <p className="mt-1 text-xs text-n600">
                      Applied over Dealer Price, same as the Add Product form (OBD-23). Blank imports
                      at 0% margin (no markup yet) — correct it per product afterward via Edit.
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-n600">
                  Each row&apos;s own subcategory above (auto-detected, editable) is used when present;
                  the default here only fills in rows with no detected subcategory. Margin is
                  optional too — leave blank and fix per product in the list afterward (category,
                  margin, and every other field are all editable there).
                </p>
                <label className="mt-3 inline-flex items-center gap-2 text-[13px] text-ink">
                  <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} className="h-3.5 w-3.5 accent-ember-deep" />
                  Activate immediately (otherwise imported hidden — review pricing first)
                </label>
              </div>

              <ActionError error={commitError} />
              <div className="mt-4 flex gap-2.5">
                <button onClick={() => void commit()} disabled={!canCommit} className={btnEmber}>
                  {committing ? "Importing…" : `Import ${importableRows.length} products`}
                </button>
                <button onClick={close} className={btnGhostSm}>Cancel</button>
              </div>
            </>
          )}

          {result && (
            <div className="mt-2">
              <p className="text-sm text-ink">
                <b className="num text-ok">{result.created}</b> products created
                {result.mergedDuplicates > 0 && (
                  <> (<b className="num">{result.mergedDuplicates}</b> repeated row{result.mergedDuplicates === 1 ? "" : "s"} merged into quantity)</>
                )}
                {result.failed.length > 0 && <> · <b className="num text-warn">{result.failed.length}</b> failed</>}.
              </p>
              {result.failed.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-auto rounded-[2px] border border-n200 p-2 text-[12px] text-n600">
                  {result.failed.map((f) => (
                    <li key={f.sku}>{f.sku}: {f.error}</li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex gap-2.5">
                <button onClick={reset} className={btnGhostSm}>Import another file</button>
                <button onClick={close} className={btnEmberSm}>Done</button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

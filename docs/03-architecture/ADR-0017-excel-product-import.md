# ADR-0017 — Admin Excel product import (supplier stock sheets)

> Status: Accepted (owner-directed) · Date: 2026-11-21

## Context

The owner supplied two real supplier stock sheets (LI-NING, HUNDRED,
badminton equipment) to bulk-populate the catalogue. Both share one
layout family — a multi-row merged header, Item Code / Model / GST /
Dealer (ex/incl GST) / MSP / MRP / Size / Colour / Status columns — but
differ in detail (LI-NING has a per-row GST % column; HUNDRED doesn't;
one column is reused for "Colour" on non-footwear rows and "Size (UK)"
on footwear rows in the same sheet). ADR-0015 (supplier fields) and
ADR-0016 (variant grouping) were built in anticipation of exactly this.

## Decision

- **Preview before commit, always.** Uploading a file never writes to the
  database. `POST /api/admin/products/import/preview` parses the file and
  returns every row (with a candidate SKU and any warnings) for admin
  review; `POST /api/admin/products/import/commit` is a separate,
  explicit step that only processes rows the admin has seen.
- **Pure parsing logic, independently tested.** `src/lib/excel-import-mapping.ts`
  takes a plain 2D grid (no xlsx/DB dependency) and maps it to import
  rows; `server/excel-import.ts` does the actual file reading (via
  `exceljs`) and hands it a grid. 32 unit tests cover both sheets' real
  structure, including the dual-purpose size/colour column, blank-code
  continuation rows, the blank-spacer-rows-with-a-stray-"0" noise, and
  "no stock" detection.
- **Header detection by text, not fixed column indices** — so a
  similarly-laid-out but differently-ordered future sheet still parses;
  `headerNotFound` is reported instead of guessing when nothing
  recognisable is found.
- **Column mapping to ProSmash fields:**
  - Item Code → `supplierCode` (ADR-0015); base model prefix (regex
    `^[A-Za-z]+\d+`) → `groupKey` (ADR-0016). A blank-code row with real
    price data is a continuation of the previous coded row — carried
    forward, synthesised as `<lastBase>-cont<n>`.
  - MRP → `mrpPaise`. Dealer "W.O GST" (pre-tax) → `purchaseValue`, FIXED
    mode (if only "With GST" is present, pre-tax is back-computed from
    the row's own GST %). MSP → `mspPaise` (ADR-0015, record-keeping).
  - GST % column (when present) → `gstPercent` (ADR-0014).
  - Colour/Size → ADR-0015/0016 fields, resolved per-row: an explicit
    "Color" column always wins; a bare "SIZE"-headered column is treated
    as size when its value looks like a plausible footwear size,
    otherwise as colour/finish text (only when no explicit colour column
    already claimed the row).
  - "no stock" status → `inStock: false` (ADR-0015).
  - **HSN is never populated by the importer** — neither sheet has an
    HSN column; stays null, same as any manually-created product.
- **What the sheet does NOT provide, the admin supplies once per batch**
  (not invented): **category** and **brand** (no reliable per-row signal
  — real sheets analysed so far are single-sport, so one batch value is
  correct) and **ProSmash margin** (mode + value, applied exactly like
  the Add Product form: `stdPaise = purchasePaise + marginPaise`,
  OBD-23).
- **Subcategory gets a best-effort per-row guess, not one batch value.**
  `detectSubcategory()` (`lib/excel-import-mapping.ts`) runs per row.
  Checked against the real LI-NING file, name-keyword matching alone
  barely helps — most Item Codes ("ABLW033-1", "ACPV021-16"…) carry no
  descriptive text — so it also uses structural signals the parser
  already resolves: racket weight-class notation ("3U"/"(4U)", universal
  on badminton racket specs), footwear-style numeric sizes, apparel
  letter-sizes (XS/S/M/L, which the dual-purpose size/colour column can
  land in either field), a "GP"-prefixed grip model-number convention,
  and a string-gauge "…mm" suffix, plus a modest keyword list (bag,
  insole, sock, shuttlecock, string/reel/polylon, racket). Returns null
  (not a guess) when nothing matches. The preview shows the guess
  editable per displayed row; the batch's "Default subcategory" fills in
  only the rows with no guess at all — not the same field as before,
  which applied to every row uniformly.
- **SKU auto-generation.** The sheet's own codes don't match ProSmash's
  `AB-0000` primary-key format. The admin picks a 2-letter prefix (default
  `BD`); `nextSkuSequence()` continues after the highest existing number
  under that prefix, so a repeat import never collides with a previous
  one. The original supplier code is preserved in `supplierCode` for
  traceability — nothing is lost, it just isn't the primary key.
- **Imports as `active: false` by default.** Nothing goes live in the
  buyer-facing catalogue until the admin reviews the batch (pricing,
  category, images) and activates individual rows — same mechanism
  (`ActiveToggle` / the Edit action) as any manually-created product. An
  "Activate immediately" checkbox is available for a reviewed batch.
- **Partial-failure, not all-or-nothing.** A row missing MRP or dealer
  price is excluded from the commit (and from the "ready to import"
  count) rather than blocking the whole batch; any row that still fails
  validation at commit time (bounds, bad SKU, etc.) is reported in
  `failed: [{sku, error}]` without aborting the rows that succeeded.
- **One audit log entry per batch** (`product.bulk-import`, with
  created/failed counts and the batch config) rather than one per row —
  consistent with treating this as a single admin action.

## Scope / known v1 simplifications

- Category/brand/margin are **uniform across the whole batch** — there
  is no per-row category inference (the sheets carry no sport/category
  data at all); admin re-classifies individual rows afterward via the
  existing Edit action if a batch actually spans categories. Subcategory
  IS inferred per row (see above), but the heuristic is best-effort, not
  exhaustive — rows with an opaque code and no structural signal fall
  back to the batch default and may still need a manual fix afterward.
- The preview table renders at most 300 rows for UI performance on a
  very large sheet (HUNDRED's is 4,335 rows) — every row is still part of
  the import; only the *display* is capped, clearly labelled.
- `baseCode()`'s regex assumes the LI-NING-style "letters immediately
  followed by digits" code format (confirmed from real data). A
  differently-formatted supplier code (e.g. with a separator before the
  digits) simply won't derive a shared `groupKey` automatically — it
  falls back to an ungrouped, standalone product (the safe default, not
  an error) and can be grouped manually via the Edit action.
- No image import — consistent with the standing "no placeholder
  imagery" rule; images are added by the admin afterward, same as any
  product.
- Not transactionally safe against a *concurrent* import generating the
  same SKU range (acceptable for an occasional admin-only tool).

## Consequences

- No schema change was needed — every field the importer writes
  (`supplierCode`, `mrpPaise`, `mspPaise`, `gstPercent`, `color`, `size`,
  `inStock`, `groupKey`) already existed from ADR-0014/0015/0016.
- New dependency: `exceljs` (MIT) for `.xlsx` reading — chosen over the
  `xlsx` (SheetJS) npm package, which is capped at a version with a known
  unpatched vulnerability on the npm registry (SheetJS publishes patched
  releases only via their own CDN, not npm).

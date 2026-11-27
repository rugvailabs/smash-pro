/** ADR-0017: pure logic for mapping a supplier stock-sheet grid (LI-NING,
 *  HUNDRED, or similar) to ProSmash product import rows. Operates on a
 *  plain 2D array of cell values — no xlsx/DB dependency — so it's
 *  independently unit-testable; server/excel-import.ts does the actual
 *  file reading (ExcelJS) and DB work around this.
 *
 *  The two sheets analysed share one layout family but differ in detail
 *  (LI-NING has a per-row GST % column; HUNDRED doesn't; column order
 *  shifts by one). Rather than hardcode either file, columns are detected
 *  by HEADER TEXT across the first ~8 rows (these sheets use a multi-row
 *  merged header, e.g. "DEALER" spanning two sub-columns "W.O GST"/"With
 *  GST" one row down) — so a differently-ordered but similarly-labelled
 *  sheet should still parse.
 *
 *  Known source-data messiness this deliberately works around:
 *  - Many rows are a SIZE/COLOUR continuation of the row above, with a
 *    blank Item Code — carried forward from the last coded row.
 *  - One column is reused for "Colour" on non-footwear rows and "Size
 *    (UK)" on footwear rows in the SAME sheet — resolved per-row by
 *    whether the value parses as a plausible shoe size.
 *  - Hundreds of blank spacer rows between model blocks — dropped.
 */

export interface ImportedRow {
  /** the raw Item Code as it appeared in the sheet (or a synthesised
   *  `<lastCode>-cont<n>` for a continuation row with no code of its own) */
  supplierCode: string;
  /** base model code (leading letters+digits before the first variant
   *  dash) — becomes groupKey; every row sharing one base joins one
   *  buyer-facing listing (ADR-0016) */
  groupKey: string;
  name: string;
  color: string | null;
  size: string | null;
  mrp: number | null;
  /** dealer/purchase price, pre-tax ("W.O GST" column when present) */
  dealerExGst: number | null;
  msp: number | null;
  gstPercent: number | null;
  /** true unless the sheet's STATUS/STOCK column says "no stock" */
  inStock: boolean;
  /** row number in the source sheet (1-indexed), for admin cross-reference */
  sourceRow: number;
  warnings: string[];
  /** best-effort subcategory guess (see detectSubcategory) — null when no
   *  signal was found; admin confirms/overrides before commit either way */
  suggestedSub: string | null;
  /** main product image — only ever a path under the approved `/img/...`
   *  library tree (IMG_PATH_RE below), same authority as assertImgPath in
   *  server/admin.ts; a sheet-provided path that doesn't match is dropped
   *  (not a row failure — it's an optional field) with a warning. */
  img: string | null;
  /** additional images beyond the first, same path authority as `img`. */
  gallery: string[] | null;
}

/** Mirrors assertImgPath in server/admin.ts / IMG_RE in
 *  admin-image-field.tsx — kept as a local constant rather than imported so
 *  this file stays a dependency-free pure module; the real authority at
 *  commit time is still assertImgPath, this is just an early filter so an
 *  obviously-malformed sheet value doesn't get stored as if it were real. */
const IMG_PATH_RE = /^\/img\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp)$/i;

export interface ParseResult {
  rows: ImportedRow[];
  /** rows skipped as blank spacers (no code, no price data) */
  skippedBlankRows: number;
  /** true if no recognisable header row was found at all */
  headerNotFound: boolean;
}

type Cell = string | number | null;
type Grid = Cell[][];

function cellText(v: Cell): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

function cellNumber(v: Cell): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** A plausible footwear size: a bare number, optionally with a .5 half
 *  size, typically 1–20. Format/range check only — not a business rule
 *  about actual shoe sizing systems. */
function looksLikeSize(v: Cell): boolean {
  if (v === null || v === undefined || v === "") return false;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) && n > 0 && n <= 60 && Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;
}

export interface HeaderMap {
  itemCode?: number;
  model?: number;
  gstPercent?: number;
  dealerExGst?: number;
  dealerInclGst?: number;
  msp?: number;
  mrp?: number;
  /** an UNAMBIGUOUS "Color"-headered column (e.g. HUNDRED) — always colour,
   *  regardless of its value's shape. */
  explicitColor?: number;
  /** every column literally headered "SIZE" — on a sheet with an explicit
   *  colour column these are unambiguous size columns; on a sheet WITHOUT
   *  one (e.g. LI-NING) the same column slot is reused for finish/colour
   *  text on non-footwear rows, so these are resolved per-row instead. */
  sizeCols: number[];
  /** every column whose header mentions "image" (e.g. "Image 1 Path
   *  (Hero)", "Image 2 Path (Angle/Detail)") — first becomes `img`, the
   *  rest become `gallery`, in column order. */
  imgCols: number[];
  /** an explicit per-row "Subcategory" column, when the sheet carries one
   *  (e.g. a per-product template, unlike LI-NING/HUNDRED's raw stock
   *  sheets which never do) — always wins over the keyword/structural
   *  guess in detectSubcategory(), since real sheet data beats a guess. */
  sub?: number;
  status?: number;
  headerRowsEnd: number; // first row index (0-based) after the header block
}

/** One column as shown to an admin confirming/correcting the auto-detected
 *  mapping — see describeColumns() below. */
export interface ColumnDescriptor {
  index: number;
  /** best-available label for this column — the detected header text, or a
   *  positional fallback ("Column 3") when the sheet has none. */
  header: string;
  /** one real value from the first data row, for a human to recognise the
   *  column by content when the header text alone is ambiguous or missing. */
  sample: string;
}

/** Scans the first `maxScan` rows for the row most likely to be the header
 *  block (scored by matching a few unambiguous keywords), returning its top
 *  label row and the sub-label row directly below it (e.g. "DEALER" / "W.O
 *  GST" | "With GST"). bestRow stays -1 when nothing scores — callers decide
 *  what to do (auto-detection bails out; the manual-mapping UI still shows
 *  columns, assuming a single header row at the very top). */
function scanHeaderRow(grid: Grid, maxScan: number): { bestRow: number; top: Cell[]; sub: Cell[] } {
  let bestRow = -1;
  let bestScore = 0;
  for (let r = 0; r < Math.min(maxScan, grid.length); r++) {
    const row = grid[r];
    let score = 0;
    for (const cell of row) {
      const t = cellText(cell).toLowerCase();
      if (/item\s*code/.test(t) || /^mrp\b/.test(t) || /^msp$/.test(t) || /dealer/.test(t)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestRow = r;
    }
  }
  return { bestRow, top: grid[bestRow] ?? [], sub: grid[bestRow + 1] ?? [] };
}

/** Combines a header scan into column index → field assignments. Returns
 *  undefined columns for anything not found — callers treat those as
 *  absent, not an error (e.g. HUNDRED has no GST % column at all). */
function detectHeaders(grid: Grid, maxScan = 8): HeaderMap {
  const map: HeaderMap = { headerRowsEnd: 1, sizeCols: [], imgCols: [] };
  const { bestRow, top, sub } = scanHeaderRow(grid, maxScan);
  if (bestRow === -1) return map;

  const ncols = Math.max(top.length, sub.length);
  for (let c = 0; c < ncols; c++) {
    const t = cellText(top[c]).toLowerCase();
    const s = cellText(sub[c]).toLowerCase();
    if (/item\s*code/.test(t)) map.itemCode = c;
    else if (/sub\s*cat/.test(t)) map.sub = c;
    // A real image-PATH column ("Image 1 Path (Hero)", "Image 2 Preview")
    // is distinguished from LI-NING's "MODEL/IMAGE" combined name column
    // and HUNDRED's bare "Image"-labeled name column (checked next) by a
    // trailing digit or the words "path"/"photo" — neither ever appears on
    // the two known name-field conventions this importer was first built
    // against, so this has to run BEFORE the looser `model` check below.
    else if (/image\s*\d|image.*path|photo/.test(t)) map.imgCols.push(c);
    // "MODEL/IMAGE" (LI-NING) and bare "Image" (HUNDRED) are this field's
    // original two conventions; "Product Name"/"Item Name"/"Title" are the
    // common labels a per-product template (e.g. Yonex) uses instead. Bare
    // "name" is deliberately NOT matched here — a sheet column like "Brand
    // Name" would false-positive on it; only the compound phrases are
    // specific enough to trust as a default guess.
    else if (/model|image|product\s*name|item\s*name|\btitle\b/.test(t)) map.model = c;
    else if (t === "gst") map.gstPercent = c;
    else if (/dealer/.test(t) || /w\.?\s*o\s*gst/.test(s) || /with\s*gst/.test(s)) {
      if (/w\.?\s*o\s*gst/.test(s)) map.dealerExGst = c;
      else if (/with\s*gst/.test(s)) map.dealerInclGst = c;
      else if (map.dealerExGst === undefined) map.dealerExGst = c; // single DEALER column, no sub-split
    } else if (/^msp$/.test(t)) map.msp = c;
    else if (/^mrp\b/.test(t)) map.mrp = c;
    else if (/^color$/.test(t)) map.explicitColor = c;
    else if (/size/.test(t)) map.sizeCols.push(c);
    else if (/status|stock/.test(t)) map.status = c;
  }

  // header block runs through the first couple of rows after the best
  // match that still look like header text (blank/short rows follow)
  let end = bestRow + 1;
  while (end < grid.length && end < bestRow + 4) {
    const row = grid[end] ?? [];
    const nonEmpty = row.filter((c) => cellText(c) !== "").length;
    const looksNumeric = row.some((c) => typeof c === "number");
    if (nonEmpty === 0 || looksNumeric) break;
    end++;
  }
  map.headerRowsEnd = end;
  return map;
}

/** Describes every column in the sheet (best-available header text + a
 *  real sample value) alongside the best-effort auto-detected mapping, for
 *  an admin to confirm or correct before parsing — the fix for a sheet
 *  shaped differently enough that no amount of header-text pattern-matching
 *  would have recognised it (see ADR-0017 follow-up: every supplier labels
 *  the same column differently, there's no finite list of synonyms to
 *  pre-empt). Assumes a single header row at the very top when
 *  detectHeaders() found no scorable keyword row at all — the common case
 *  for a sheet whose column names just don't match the known vocabulary. */
export function describeColumns(grid: Grid, maxScan = 8): { columns: ColumnDescriptor[]; guess: HeaderMap } {
  const guess = detectHeaders(grid, maxScan);
  const { bestRow, top, sub } = scanHeaderRow(grid, maxScan);
  const headerRow = bestRow === -1 ? (grid[0] ?? []) : top;
  const sampleRow = grid[guess.headerRowsEnd] ?? [];
  const ncols = Math.max(headerRow.length, sub.length, sampleRow.length);

  const columns: ColumnDescriptor[] = [];
  for (let c = 0; c < ncols; c++) {
    const header = cellText(headerRow[c]) || cellText(sub[c]) || `Column ${c + 1}`;
    columns.push({ index: c, header, sample: cellText(sampleRow[c]) });
  }
  return { columns, guess };
}

function baseCode(code: string): string {
  const m = /^([A-Za-z]+\d+)/.exec(code);
  return m ? m[1] : code;
}

/** Best-effort subcategory guess for one row. Name-keyword matching alone
 *  catches very little on a real supplier sheet — checked against the
 *  actual LI-NING file, the large majority of Item Codes are opaque
 *  alphanumeric strings ("ABLW033-1", "ACPV021-16"…) with no descriptive
 *  model text at all. So this combines a modest keyword list with
 *  structural signals the parser already resolves per row: apparel
 *  letter-sizes and footwear-style numeric sizes (which the dual-purpose
 *  size/colour column can land in either `size` or `color` depending on
 *  what else is on the row — see parseStockSheet), racket weight-class
 *  notation ("3U"/"(4U)"/"5U-G6", universal on badminton racket specs),
 *  the "GP"-prefixed model-number convention badminton grips use, and a
 *  string-gauge "…mm" suffix. Returns null, not a guess, when nothing
 *  matches — the batch default (or an admin override) applies instead,
 *  same as any other field this importer can't determine from the sheet. */
export function detectSubcategory(row: { name: string; size: string | null; color: string | null }): string | null {
  const name = row.name.toLowerCase().trim();

  if (/\binsole(s)?\b/.test(name)) return "Accessories";
  if (/^gp\d/.test(name) || /\bgrip(s)?\b|\btowel\s*grip\b/.test(name)) return "Grips";
  if (/\bbag(s)?\b/.test(name)) return "Bags";
  if (/\bsock(s)?\b/.test(name)) return "Socks";
  if (/\bshuttle(cock)?(s)?\b/.test(name)) return "Shuttlecocks";
  if (/\bstring(s)?\b|\breel(s)?\b|\brolls?\b|\bpolylon\b|\d(\.\d+)?\s*mm\b/.test(name)) return "Strings";
  if (/\bracket(s)?\b|\bracquet(s)?\b/.test(name) || /\(?\s*\d\s?u\b/i.test(name)) return "Rackets";

  for (const v of [row.size, row.color]) {
    if (v === null) continue;
    const trimmed = v.trim();
    if (/^\d*x*(s|m|l)$/i.test(trimmed)) return "Apparel";
    if (/\bmm\b/i.test(trimmed)) return "Strings";
    if (looksLikeSize(trimmed)) return "Shoes";
  }

  return null;
}

/** Parses a supplier stock-sheet grid into import-ready rows. `grid[r][c]`
 *  is the raw cell value; row 0 is the sheet's first row (1-indexed
 *  `sourceRow` in the output matches the original sheet for cross-
 *  reference).
 *
 *  `explicitMapping` — when provided (an admin-confirmed mapping from
 *  describeColumns(), see admin-product-import.tsx), it's used AS-IS
 *  instead of running header-text detection at all; this is what makes an
 *  unrecognised sheet shape still importable instead of permanently
 *  excluded, since the admin is telling the parser exactly which column is
 *  which rather than the parser having to guess from label text. */
export function parseStockSheet(grid: Grid, explicitMapping?: HeaderMap): ParseResult {
  const headers = explicitMapping ?? detectHeaders(grid);
  if (!explicitMapping && headers.itemCode === undefined && headers.model === undefined) {
    return { rows: [], skippedBlankRows: 0, headerNotFound: true };
  }

  const rows: ImportedRow[] = [];
  let skippedBlankRows = 0;
  // Continuation codes are synthesised from the FULL last coded value, not
  // just its stripped base model — two separate coded blocks sharing one
  // base (e.g. "AYTW021-1" and "AYTW021-2", two different colourways of
  // the same shoe) each restart their own continuation count, and basing
  // the synthesised code on the base alone collided them onto the same
  // string (e.g. both producing "AYTW021-cont2") even though they're
  // genuinely different products. Using the full code keeps them unique
  // while groupKey (derived via baseCode() below) still correctly
  // collapses both blocks into one buyer-facing listing.
  let lastFullCode: string | null = null;
  let continuationCounter = 0;

  for (let r = headers.headerRowsEnd; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const get = (c?: number) => (c === undefined ? null : row[c] ?? null);

    const rawCode = cellText(get(headers.itemCode));
    const mrp = cellNumber(get(headers.mrp));
    const dealerExGst = cellNumber(get(headers.dealerExGst));
    const dealerInclGst = cellNumber(get(headers.dealerInclGst));
    // > 0, not !== null: a literal 0 in the MSP column means "not recorded"
    // on this sheet (same convention as the spacer-row price fields below),
    // not a real MSP of ₹0 — treating it as a real value previously caused
    // commit-time validation (which rejects MSP <= 0) to silently drop
    // otherwise-valid rows.
    const mspRaw = cellNumber(get(headers.msp));
    const msp = mspRaw !== null && mspRaw > 0 ? mspRaw : null;
    const name = cellText(get(headers.model));

    // > 0, not just !== null: the sheet's blank spacer rows between model
    // blocks carry a literal "0" in the dealer-price column and nothing
    // else — a real product row never has ₹0 pricing.
    const hasPriceData =
      (mrp !== null && mrp > 0) || (dealerExGst !== null && dealerExGst > 0) ||
      (dealerInclGst !== null && dealerInclGst > 0) || (msp !== null && msp > 0);
    if (!rawCode && !hasPriceData) {
      skippedBlankRows++;
      continue;
    }

    let supplierCode: string;
    if (rawCode) {
      supplierCode = rawCode;
      lastFullCode = rawCode;
      continuationCounter = 0;
    } else if (lastFullCode) {
      continuationCounter++;
      supplierCode = `${lastFullCode}-cont${continuationCounter}`;
    } else {
      // price data with no code at all and nothing to carry forward —
      // can't safely synthesise a group; skip rather than guess.
      skippedBlankRows++;
      continue;
    }
    const groupKey = baseCode(supplierCode);

    const warnings: string[] = [];
    if (mrp === null) warnings.push("missing MRP");
    if (dealerExGst === null && dealerInclGst === null) warnings.push("missing dealer price");
    if (!name && rawCode) warnings.push("missing model name");

    // Colour: an unambiguous "Color" column (HUNDRED) always wins.
    let color: string | null = null;
    if (headers.explicitColor !== undefined) {
      const v = cellText(get(headers.explicitColor));
      color = v || null;
    }

    // Size: every "SIZE"-headered column, joined. On a sheet WITHOUT an
    // explicit colour column (LI-NING), the same slot is reused for
    // finish/colour text on non-footwear rows — disambiguate per-row by
    // whether every value present looks like a plausible footwear size;
    // if not, and there's no separate colour column already resolved,
    // treat the content as colour/finish text instead.
    let size: string | null = null;
    const sizeVals = headers.sizeCols.map((c) => get(c)).filter((v) => cellText(v) !== "");
    if (sizeVals.length > 0) {
      if (headers.explicitColor !== undefined) {
        size = sizeVals.map(cellText).join(" / ");
      } else if (sizeVals.every(looksLikeSize)) {
        size = sizeVals.map(cellText).join(" / ");
      } else if (color === null) {
        color = sizeVals.map(cellText).join(" / ");
      }
    }

    const statusText = cellText(get(headers.status)).toLowerCase();
    const inStock = !/no\s*stock/.test(statusText);

    // Two conventions seen across sheets: LI-NING stores a fraction (0.05 ->
    // 5%); a plain per-product template (e.g. Yonex) stores the already-
    // whole percent (18 -> 18%). Every real GST rate is >= 1 as a whole
    // percent (5/12/18/28) and < 1 as a fraction, so that split reliably
    // tells the two apart — only exact 0% is ambiguous, and maps to 0 either way.
    const gstPercentRaw = cellNumber(get(headers.gstPercent));
    const gstPercent = gstPercentRaw !== null
      ? Math.round((gstPercentRaw > 1 ? gstPercentRaw : gstPercentRaw * 100) * 100) / 100
      : null;
    const rowName = name || supplierCode;

    // First non-empty image column becomes the main image, the rest
    // (also non-empty — a sheet's "Image N Preview" column sitting between
    // path columns is just always blank and drops out here) become the
    // gallery. A value present but not shaped like an approved `/img/...`
    // path is dropped, not treated as real — optional field, not a reason
    // to fail the whole row.
    const imgRaw = headers.imgCols.map((c) => cellText(get(c))).filter((v) => v !== "");
    const imgValid = imgRaw.filter((v) => IMG_PATH_RE.test(v));
    if (imgValid.length < imgRaw.length) warnings.push("one or more image paths don't look like an approved /img/... path — skipped");
    const img = imgValid[0] ?? null;
    const gallery = imgValid.length > 1 ? imgValid.slice(1) : null;

    // A sheet's own Subcategory column (when mapped) is real data, not a
    // guess — it always wins over detectSubcategory()'s keyword/structural
    // heuristic, which exists only for sheets that don't carry one at all.
    const sheetSub = cellText(get(headers.sub));
    const suggestedSub = sheetSub || detectSubcategory({ name: rowName, size, color });

    rows.push({
      supplierCode,
      groupKey,
      name: rowName,
      color,
      size,
      mrp,
      dealerExGst: dealerExGst ?? (dealerInclGst !== null && gstPercent !== null
        ? Math.round((dealerInclGst / (1 + gstPercent / 100)) * 100) / 100
        : dealerInclGst),
      msp,
      gstPercent,
      inStock,
      sourceRow: r + 1,
      warnings,
      suggestedSub,
      img,
      gallery,
    });
  }

  propagateSubcategoryWithinGroups(rows);
  return { rows, skippedBlankRows, headerNotFound: false };
}

/** Backfills `suggestedSub` for rows where detectSubcategory found no
 *  signal, from a sibling row sharing the same groupKey that DID get
 *  classified — e.g. a group's named row ("Tectonic 1 S", a known
 *  LI-NING shoe line) often carries no size of its own, while its
 *  continuation rows below do, and that's where the structural "Shoes"
 *  signal actually lands. groupKey already means "one buyer-facing
 *  product line" (ADR-0016), so borrowing the group's own classification
 *  is far more reliable than leaving it null. Majority vote per group in
 *  the rare case of disagreement; mutates `rows` in place. */
function propagateSubcategoryWithinGroups(rows: ImportedRow[]): void {
  const votesByGroup = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (r.suggestedSub === null) continue;
    const votes = votesByGroup.get(r.groupKey) ?? new Map<string, number>();
    votes.set(r.suggestedSub, (votes.get(r.suggestedSub) ?? 0) + 1);
    votesByGroup.set(r.groupKey, votes);
  }
  const winnerByGroup = new Map<string, string>();
  for (const [groupKey, votes] of votesByGroup) {
    const [winner] = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
    winnerByGroup.set(groupKey, winner);
  }
  for (const r of rows) {
    if (r.suggestedSub === null) {
      r.suggestedSub = winnerByGroup.get(r.groupKey) ?? null;
    }
  }
}

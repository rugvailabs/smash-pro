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
}

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

interface HeaderMap {
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
  status?: number;
  headerRowsEnd: number; // first row index (0-based) after the header block
}

/** Scans the first `maxScan` rows for recognisable header text, combining
 *  a top label row (e.g. "DEALER", "MRP") with the sub-label row directly
 *  below it (e.g. "W.O GST", "With GST") when present. Returns undefined
 *  columns for anything not found — callers treat those as absent, not an
 *  error (e.g. HUNDRED has no GST % column at all). */
function detectHeaders(grid: Grid, maxScan = 8): HeaderMap {
  const map: HeaderMap = { headerRowsEnd: 0, sizeCols: [] };
  let bestRow = -1;
  let bestScore = 0;

  for (let r = 0; r < Math.min(maxScan, grid.length); r++) {
    const row = grid[r];
    let score = 0;
    for (const cell of row) {
      const t = cellText(cell).toLowerCase();
      if (/item\s*code/.test(t) || /^mrp$/.test(t) || /^msp$/.test(t) || /dealer/.test(t)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestRow = r;
    }
  }
  if (bestRow === -1) return { ...map, headerRowsEnd: 0 };

  const top = grid[bestRow] ?? [];
  const sub = grid[bestRow + 1] ?? [];
  const ncols = Math.max(top.length, sub.length);

  for (let c = 0; c < ncols; c++) {
    const t = cellText(top[c]).toLowerCase();
    const s = cellText(sub[c]).toLowerCase();
    if (/item\s*code/.test(t)) map.itemCode = c;
    else if (/model|image/.test(t)) map.model = c;
    else if (t === "gst") map.gstPercent = c;
    else if (/dealer/.test(t) || /w\.?\s*o\s*gst/.test(s) || /with\s*gst/.test(s)) {
      if (/w\.?\s*o\s*gst/.test(s)) map.dealerExGst = c;
      else if (/with\s*gst/.test(s)) map.dealerInclGst = c;
      else if (map.dealerExGst === undefined) map.dealerExGst = c; // single DEALER column, no sub-split
    } else if (/^msp$/.test(t)) map.msp = c;
    else if (/^mrp$/.test(t)) map.mrp = c;
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

function baseCode(code: string): string {
  const m = /^([A-Za-z]+\d+)/.exec(code);
  return m ? m[1] : code;
}

/** Parses a supplier stock-sheet grid into import-ready rows. `grid[r][c]`
 *  is the raw cell value; row 0 is the sheet's first row (1-indexed
 *  `sourceRow` in the output matches the original sheet for cross-
 *  reference). */
export function parseStockSheet(grid: Grid): ParseResult {
  const headers = detectHeaders(grid);
  if (headers.itemCode === undefined && headers.model === undefined) {
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

    const gstPercentRaw = cellNumber(get(headers.gstPercent));
    const gstPercent = gstPercentRaw !== null ? Math.round(gstPercentRaw * 100 * 100) / 100 : null; // 0.05 -> 5

    rows.push({
      supplierCode,
      groupKey,
      name: name || supplierCode,
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
    });
  }

  return { rows, skippedBlankRows, headerNotFound: false };
}

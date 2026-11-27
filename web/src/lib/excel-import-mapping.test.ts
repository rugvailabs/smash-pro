import { test } from "node:test";
import assert from "node:assert/strict";
import { detectSubcategory, parseStockSheet } from "./excel-import-mapping";

/* ADR-0017: these grids mirror the real structure found analysing the
 * LI-NING and HUNDRED supplier stock sheets — multi-row merged headers,
 * a dual-purpose size/colour column (LI-NING), an explicit "Color" column
 * (HUNDRED), blank spacer rows with a stray literal "0", and size-variant
 * continuation rows with a blank Item Code. */

const LININGRID = [
  ["0", null, null, null, null, null, null, null, null, " ", null, null],
  [null, null, null, "REVISED PRICE W.EF-10-MAY-2026", null, null, null, null, null, "COLOR", "STOCK", "ORDER"],
  [null, "Item Code ", "MODEL/IMAGE", "GST", "DEALER", null, "MSP", "MRP", "SIZE", "SIZE", "STATUS", "QTY"],
  [null, null, null, "%", "W.O GST", "With GST", null, null, "US", "UK", null, null],
  [null, "AYPU021-3", "Halbertec 9000 (3U)", 0.05, 14285.71, 15000, 18990, 25990, null, "Green/Purple", null, null],
  [null, "AYPU021-4", "Halbertec 9000 (4U)", 0.05, 14285.71, 15000, 18990, 25990, null, "Green/Purple", null, null],
  [null, null, null, null, "0", null, null, null, null, null, null, null], // spacer row
  [null, "AYTV021-1", "HALBERD STRIKE", 0.18, 3576.27, 4220, 5290, 8990, "4", "3", null, null],
  [null, null, null, 0.18, 3576.27, 4220, 5290, 8990, "5", "4", null, null], // size continuation
  [null, null, null, 0.18, 3576.27, 4220, 5290, 8990, "8.5", "7.5", "no stock ", null], // out of stock
];

test("LI-NING-shape sheet: resolves headers, prices, GST% and the colour/size dual column", () => {
  const { rows, skippedBlankRows, headerNotFound } = parseStockSheet(LININGRID);
  assert.equal(headerNotFound, false);
  assert.equal(skippedBlankRows, 1); // the spacer row only

  assert.equal(rows.length, 5);

  const first = rows[0];
  assert.equal(first.supplierCode, "AYPU021-3");
  assert.equal(first.groupKey, "AYPU021");
  assert.equal(first.name, "Halbertec 9000 (3U)");
  assert.equal(first.color, "Green/Purple");
  assert.equal(first.size, null);
  assert.equal(first.mrp, 25990);
  assert.equal(first.dealerExGst, 14285.71);
  assert.equal(first.msp, 18990);
  assert.equal(first.gstPercent, 5);
  assert.equal(first.inStock, true);
});

test("LI-NING-shape sheet: both size columns numeric -> joined size, no colour", () => {
  const { rows } = parseStockSheet(LININGRID);
  const sized = rows.find((r) => r.supplierCode === "AYTV021-1")!;
  assert.equal(sized.size, "4 / 3");
  assert.equal(sized.color, null);
});

test("LI-NING-shape sheet: blank-code rows with real price data become continuations of the same group", () => {
  const { rows } = parseStockSheet(LININGRID);
  // synthesised from the FULL coded value ("AYTV021-1"), not the stripped
  // base ("AYTV021") — see the collision-reproduction test below for why
  const continuations = rows.filter((r) => r.supplierCode.startsWith("AYTV021-1-cont"));
  assert.equal(continuations.length, 2);
  for (const c of continuations) assert.equal(c.groupKey, "AYTV021");
});

test("two coded blocks sharing one base model get DISTINCT continuation codes (regression: real-world collision found after a live import, where two different colourways' continuation rows both synthesised to the same 'AYTW021-cont2' string)", () => {
  const grid = [
    [null, "Item Code ", "MODEL/IMAGE", "GST", "DEALER", null, "MSP", "MRP", "SIZE", "SIZE", "STATUS", "QTY"],
    [null, null, null, "%", "W.O GST", "With GST", null, null, "US", "UK", null, null],
    // block 1: AYTW021-1, two size continuations
    [null, "AYTW021-1", "Shoe Model", 0.18, 3000, 3540, 4000, 7000, "6", "5", null, null],
    [null, null, null, 0.18, 3000, 3540, 4000, 7000, "7", "6", null, null],
    // block 2: AYTW021-2 — a DIFFERENT colourway of the SAME base model —
    // with its own continuation restarting the counter
    [null, "AYTW021-2", "Shoe Model", 0.18, 3000, 3540, 4000, 7000, "6", "5", null, null],
    [null, null, null, 0.18, 3000, 3540, 4000, 7000, "7", "6", null, null],
  ];
  const { rows } = parseStockSheet(grid);
  assert.equal(rows.length, 4);
  const codes = rows.map((r) => r.supplierCode);
  assert.equal(new Set(codes).size, 4, `expected 4 distinct supplier codes, got ${JSON.stringify(codes)}`);
  // both blocks still join the SAME buyer-facing group — only the
  // traceability code is disambiguated, not the grouping
  for (const r of rows) assert.equal(r.groupKey, "AYTW021");
});

test("MRP header with extra text (regression: 'MRP (₹)' from a Yonex upload sheet was never detected because the match required the exact literal 'mrp', excluding every row for a 'missing MRP' it didn't actually have)", () => {
  const grid = [
    ["Item Code", "MODEL/IMAGE", "MRP (₹)", "DEALER", "STOCK"],
    ["GR303I", "Yonex GR 303i", 1049, 479, "Yes"],
  ];
  const { rows } = parseStockSheet(grid);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].mrp, 1049);
  assert.equal(rows[0].warnings.includes("missing MRP"), false);
});

test("LI-NING-shape sheet: 'no stock' status is detected on a continuation row", () => {
  const { rows } = parseStockSheet(LININGRID);
  const outOfStock = rows.find((r) => r.inStock === false);
  assert.ok(outOfStock);
  assert.equal(outOfStock!.size, "8.5 / 7.5");
});

test("a literal 0 in the MSP column is treated as absent, not a real ₹0 MSP (regression: this previously caused commit-time validation to reject otherwise-valid rows)", () => {
  const grid = [
    [null, "Item Code ", "MODEL/IMAGE", "GST", "DEALER", null, "MSP", "MRP", "SIZE", "SIZE", "STATUS", "QTY"],
    [null, null, null, "%", "W.O GST", "With GST", null, null, "US", "UK", null, null],
    [null, "AB-0002", "No MSP Model", 0.05, 1000, 1050, 0, 1200, null, null, null, null],
  ];
  const { rows } = parseStockSheet(grid);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].msp, null);
});

const HUNDREDGRID = [
  [null, "HUNDRED", null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, "10-MAY-2026", null, null, null, null, null, null, null, null],
  [null, "Item Code", "Image", null, "DEALER", null, "MSP", "MRP", "Color", "SIZE/UK", "STATUS", "order"],
  [null, null, null, null, "W.O GST ", "With GST", "W.GST", "W.GST", null, null, null, null],
  [null, "HD-100", "Shoe Model", null, 4000, 4500, 5500, 7990, "Black/Blue", "9", null, null],
  [null, "HD-101", "Shoe Model", null, 4000, 4500, 5500, 7990, "Black/Blue", "10", "no stock", null],
];

test("HUNDRED-shape sheet: explicit Color column always wins, no GST column present", () => {
  const { rows, headerNotFound } = parseStockSheet(HUNDREDGRID);
  assert.equal(headerNotFound, false);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].color, "Black/Blue");
  assert.equal(rows[0].size, "9");
  assert.equal(rows[0].gstPercent, null);
  assert.equal(rows[0].dealerExGst, 4000);
  assert.equal(rows[1].inStock, false);
});

test("an empty / unrecognisable sheet reports headerNotFound instead of guessing", () => {
  const result = parseStockSheet([
    ["just", "some", "random", "text"],
    ["no", "recognisable", "headers", "here"],
  ]);
  assert.equal(result.headerNotFound, true);
  assert.equal(result.rows.length, 0);
});

/* subcategory auto-detection — these keyword/structural checks are
 * grounded directly in the real LI-NING sheet, where most Item Codes
 * ("ABLW033-1", "ACPV021-16"...) carry no descriptive name at all. */
test("detectSubcategory: name keywords", () => {
  assert.equal(detectSubcategory({ name: "Insole", size: null, color: null }), "Accessories");
  assert.equal(detectSubcategory({ name: "GP1000 GRIP (10 IN 1)", size: null, color: null }), "Grips");
  assert.equal(detectSubcategory({ name: "GP100 PRO-3", size: null, color: null }), "Grips"); // "GP"-prefixed, no literal "grip"
  assert.equal(detectSubcategory({ name: "SHIDA BAG", size: null, color: null }), "Bags");
  assert.equal(detectSubcategory({ name: "3 IN 1 SOCKS", size: null, color: null }), "Socks");
  assert.equal(detectSubcategory({ name: "Feather Shuttlecock", size: null, color: null }), "Shuttlecocks");
  assert.equal(detectSubcategory({ name: "G-TOUR 3 16L 220m ROLLS BLACK", size: null, color: null }), "Strings");
  assert.equal(detectSubcategory({ name: "TS1522 POLYLON 16 200m ICE", size: null, color: null }), "Strings");
  assert.equal(detectSubcategory({ name: "Racket -Halbertec 8000 - 3U", size: null, color: null }), "Rackets");
  assert.equal(detectSubcategory({ name: "Halbertec 9000 (3U)", size: null, color: null }), "Rackets"); // weight-class only, no "racket" word
});

test("detectSubcategory: structural signals (size/colour fields) when the name is opaque", () => {
  assert.equal(detectSubcategory({ name: "ATSU847-5-3XS", size: "3XS", color: null }), "Apparel");
  assert.equal(detectSubcategory({ name: "ATSU847-5-XS", size: null, color: "XS" }), "Apparel");
  assert.equal(detectSubcategory({ name: "LNS516-39", size: "39 / 5.5", color: null }), "Shoes");
  assert.equal(detectSubcategory({ name: "ACPV021-16", size: null, color: "16 mm / Orange" }), "Strings");
});

test("detectSubcategory: an opaque code with no signal at all is left for the admin to classify", () => {
  assert.equal(detectSubcategory({ name: "ABLW033-1", size: null, color: "Dark Grey" }), null);
});

test("detectSubcategory: a decimal string gauge in the name is a Strings signal", () => {
  assert.equal(detectSubcategory({ name: "NS50  - (0.70mm)", size: null, color: "WHITE" }), "Strings");
});

test("parseStockSheet propagates a confident subcategory to groupmates with no signal of their own (regression: a named shoe-line row with no size of its own, e.g. 'Tectonic 1 S', previously stayed unclassified even though its own continuation rows carried the footwear-size signal)", () => {
  const grid = [
    [null, "Item Code ", "MODEL/IMAGE", "GST", "DEALER", null, "MSP", "MRP", "SIZE", "SIZE", "STATUS", "QTY"],
    [null, null, null, "%", "W.O GST", "With GST", null, null, "US", "UK", null, null],
    [null, "AYPS001-1", "Tectonic 1 S", 0.18, 3000, 3540, 4000, 7000, null, "White/Gold", null, null],
    [null, null, null, 0.18, 3000, 3540, 4000, 7000, "7", "6", null, null],
    [null, null, null, 0.18, 3000, 3540, 4000, 7000, "8", "7", null, null],
  ];
  const { rows } = parseStockSheet(grid);
  assert.equal(rows.length, 3);
  // row[0] itself has no size of its own (null) — only its groupmates do —
  // but the group-level backfill still classifies it as "Shoes"
  for (const r of rows) {
    assert.equal(r.suggestedSub, "Shoes");
    assert.equal(r.groupKey, "AYPS001");
  }
});

test("parseStockSheet populates suggestedSub per row from detectSubcategory", () => {
  const { rows } = parseStockSheet(LININGRID);
  const racket = rows.find((r) => r.supplierCode === "AYPU021-3")!;
  assert.equal(racket.suggestedSub, "Rackets");
  const shoe = rows.find((r) => r.supplierCode === "AYTV021-1")!;
  assert.equal(shoe.suggestedSub, "Shoes");
});

test("a row missing MRP or dealer price is still imported, flagged with a warning", () => {
  const grid = [
    [null, "Item Code ", "MODEL/IMAGE", "GST", "DEALER", null, "MSP", "MRP", "SIZE", "SIZE", "STATUS", "QTY"],
    [null, null, null, "%", "W.O GST", "With GST", null, null, "US", "UK", null, null],
    [null, "AB-0001", "No MRP Model", 0.05, 1000, 1050, 1200, null, null, null, null, null],
  ];
  const { rows } = parseStockSheet(grid);
  assert.equal(rows.length, 1);
  assert.ok(rows[0].warnings.includes("missing MRP"));
});

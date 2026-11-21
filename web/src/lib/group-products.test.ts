import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupeGroups } from "./group-products";

interface Row {
  sku: string;
  std: number;
  groupKey?: string;
  variantCount?: number;
}

/* ADR-0016: products sharing a groupKey (ADR-0015 colour/size variants of
 * one model, e.g. imported from a supplier stock sheet) must collapse to
 * ONE representative row per buyer-facing listing — never show the same
 * model's every size/colour as a separate catalogue card. */

test("ungrouped rows pass through unchanged, one-to-one", () => {
  const rows: Row[] = [
    { sku: "CR-0001", std: 100 },
    { sku: "CR-0002", std: 200 },
  ];
  assert.deepEqual(dedupeGroups(rows), rows);
});

test("grouped rows collapse to one representative, tagged with variantCount", () => {
  const rows: Row[] = [
    { sku: "AYTV079-1", std: 500, groupKey: "AYTV079" },
    { sku: "AYTV079-2", std: 500, groupKey: "AYTV079" },
    { sku: "AYTV079-3", std: 500, groupKey: "AYTV079" },
  ];
  const out = dedupeGroups(rows);
  assert.equal(out.length, 1);
  assert.equal(out[0].variantCount, 3);
});

test("the cheapest active variant becomes the group's representative", () => {
  const rows: Row[] = [
    { sku: "AYTV079-1", std: 600, groupKey: "AYTV079" },
    { sku: "AYTV079-2", std: 450, groupKey: "AYTV079" },
    { sku: "AYTV079-3", std: 700, groupKey: "AYTV079" },
  ];
  const out = dedupeGroups(rows);
  assert.equal(out.length, 1);
  assert.equal(out[0].sku, "AYTV079-2");
  assert.equal(out[0].std, 450);
  assert.equal(out[0].variantCount, 3);
});

test("mixed grouped and ungrouped rows: only the grouped ones collapse", () => {
  const rows: Row[] = [
    { sku: "CR-0001", std: 100 },
    { sku: "AYTV079-1", std: 600, groupKey: "AYTV079" },
    { sku: "AYTV079-2", std: 450, groupKey: "AYTV079" },
    { sku: "CR-0002", std: 200 },
  ];
  const out = dedupeGroups(rows);
  assert.equal(out.length, 3);
  const skus = out.map((p) => p.sku).sort();
  assert.deepEqual(skus, ["AYTV079-2", "CR-0001", "CR-0002"]);
});

test("two distinct groups both collapse independently", () => {
  const rows: Row[] = [
    { sku: "A-1", std: 100, groupKey: "A" },
    { sku: "A-2", std: 90, groupKey: "A" },
    { sku: "B-1", std: 300, groupKey: "B" },
    { sku: "B-2", std: 250, groupKey: "B" },
    { sku: "B-3", std: 400, groupKey: "B" },
  ];
  const out = dedupeGroups(rows);
  assert.equal(out.length, 2);
  const bySku = Object.fromEntries(out.map((p) => [p.sku, p]));
  assert.equal(bySku["A-2"].variantCount, 2);
  assert.equal(bySku["B-2"].variantCount, 3);
});

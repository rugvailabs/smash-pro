import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeColor, normalizeGroupKey, normalizeMsp, normalizeSize, normalizeSupplierCode } from "./product-catalog-fields";

/* ADR-0015: supplier item code / MSP / colour / size are optional,
 * admin-entered record-keeping fields for importing supplier stock
 * sheets — these tests pin down format/range validation only. */

test("normalizeSupplierCode: absent/empty input returns null, trims", () => {
  assert.equal(normalizeSupplierCode(undefined), null);
  assert.equal(normalizeSupplierCode(null), null);
  assert.equal(normalizeSupplierCode(""), null);
  assert.equal(normalizeSupplierCode("  AYPU021-3  "), "AYPU021-3");
});

test("normalizeSupplierCode: rejects values over 60 characters", () => {
  assert.throws(() => normalizeSupplierCode("A".repeat(61)), /60 characters or fewer/);
  assert.equal(normalizeSupplierCode("A".repeat(60)), "A".repeat(60));
});

test("normalizeColor: absent/empty input returns null, trims, caps at 120 chars", () => {
  assert.equal(normalizeColor(undefined), null);
  assert.equal(normalizeColor("  Green/Purple  "), "Green/Purple");
  assert.throws(() => normalizeColor("A".repeat(121)), /120 characters or fewer/);
});

test("normalizeSize: absent/empty input returns null, trims, caps at 40 chars", () => {
  assert.equal(normalizeSize(undefined), null);
  assert.equal(normalizeSize("  UK 9  "), "UK 9");
  assert.throws(() => normalizeSize("A".repeat(41)), /40 characters or fewer/);
});

test("normalizeMsp: absent input returns null", () => {
  assert.equal(normalizeMsp(undefined), null);
  assert.equal(normalizeMsp(null), null);
});

test("normalizeMsp: accepts a positive rupee amount, returns paise", () => {
  assert.equal(normalizeMsp(189.9), 18990);
  assert.equal(normalizeMsp(0.01), 1);
});

test("normalizeMsp: rejects zero, negative, out-of-range or non-numeric values", () => {
  assert.throws(() => normalizeMsp(0), /between ₹0.01 and ₹10,00,000/);
  assert.throws(() => normalizeMsp(-5), /between ₹0.01 and ₹10,00,000/);
  assert.throws(() => normalizeMsp(1_000_001), /between ₹0.01 and ₹10,00,000/);
  assert.throws(() => normalizeMsp("189.90" as unknown), /between ₹0.01 and ₹10,00,000/);
  assert.throws(() => normalizeMsp(NaN), /between ₹0.01 and ₹10,00,000/);
});

test("normalizeGroupKey: absent/empty input returns null, trims, caps at 60 chars", () => {
  assert.equal(normalizeGroupKey(undefined), null);
  assert.equal(normalizeGroupKey(null), null);
  assert.equal(normalizeGroupKey(""), null);
  assert.equal(normalizeGroupKey("  AYTV079  "), "AYTV079");
  assert.throws(() => normalizeGroupKey("A".repeat(61)), /60 characters or fewer/);
});

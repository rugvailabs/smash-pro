import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeGstPercent, normalizeHsn } from "./product-tax-fields";

/* ADR-0014: HSN code / GST % are optional, admin-entered record-keeping
 * fields — these tests pin down format/range validation only. They are
 * NOT tax-classification tests; whether a given HSN/GST% is "correct" for
 * a product stays a human (and eventually tax-professional) decision. */

test("normalizeHsn: absent/empty input returns null", () => {
  assert.equal(normalizeHsn(undefined), null);
  assert.equal(normalizeHsn(null), null);
  assert.equal(normalizeHsn(""), null);
  assert.equal(normalizeHsn("   "), null);
});

test("normalizeHsn: accepts 4-to-8-digit codes, trimmed", () => {
  assert.equal(normalizeHsn("9506"), "9506");
  assert.equal(normalizeHsn("  950630  "), "950630");
  assert.equal(normalizeHsn("95063099"), "95063099");
});

test("normalizeHsn: rejects out-of-format values", () => {
  assert.throws(() => normalizeHsn("123"), /4 to 8 digits/); // too short
  assert.throws(() => normalizeHsn("123456789"), /4 to 8 digits/); // too long
  assert.throws(() => normalizeHsn("ABCD"), /4 to 8 digits/); // non-numeric
  assert.throws(() => normalizeHsn("95-06"), /4 to 8 digits/); // punctuation
  assert.throws(() => normalizeHsn(12345 as unknown), /must be text/); // wrong type
});

test("normalizeGstPercent: absent input returns null", () => {
  assert.equal(normalizeGstPercent(undefined), null);
  assert.equal(normalizeGstPercent(null), null);
});

test("normalizeGstPercent: accepts 0-100, rounds to 2 decimals", () => {
  assert.equal(normalizeGstPercent(0), 0);
  assert.equal(normalizeGstPercent(18), 18);
  assert.equal(normalizeGstPercent(100), 100);
  assert.equal(normalizeGstPercent(12.345), 12.35);
});

test("normalizeGstPercent: rejects out-of-range or non-finite values", () => {
  assert.throws(() => normalizeGstPercent(-1), /between 0 and 100/);
  assert.throws(() => normalizeGstPercent(100.01), /between 0 and 100/);
  assert.throws(() => normalizeGstPercent(NaN), /between 0 and 100/);
  assert.throws(() => normalizeGstPercent("18" as unknown), /between 0 and 100/);
});

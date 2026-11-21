import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveToPaise, visitorDiscountPct } from "./pricing-calc";

/* These tests pin down the OBD-23 amendment (2026-11-20): ProSmash Margin
 * resolves as a % of Dealer/Purchase Price, not of MRP. Purchase Price's
 * own % mode is unchanged (still % of MRP). Visitor Discount % is always
 * computed against MRP, regardless of how the selling price was built. */

test("owner-supplied worked example: MRP 1000, dealer 600, margin 10% of dealer", () => {
  const mrpPaise = 1000 * 100;
  const purchasePaise = resolveToPaise("fixed", 600, mrpPaise); // dealer price entered directly
  assert.equal(purchasePaise, 60_000); // ₹600

  // margin % must be of the resolved purchase price, NOT of MRP
  const marginPaise = resolveToPaise("percent", 10, purchasePaise);
  assert.equal(marginPaise, 6_000); // ₹60 (10% of ₹600, not 10% of ₹1000)

  const visitorPaise = purchasePaise + marginPaise;
  assert.equal(visitorPaise, 66_000); // ₹660

  assert.equal(visitorDiscountPct(mrpPaise, visitorPaise), 34); // 34% off ₹1000
});

test("percent-mode purchase price still resolves against MRP", () => {
  const mrpPaise = 1000 * 100;
  // dealer price = 60% of MRP = ₹600
  const purchasePaise = resolveToPaise("percent", 60, mrpPaise);
  assert.equal(purchasePaise, 60_000);
});

test("fixed-₹ margin is added on top of dealer price regardless of base", () => {
  const mrpPaise = 1000 * 100;
  const purchasePaise = resolveToPaise("fixed", 600, mrpPaise);
  // a fixed margin ignores whatever base is passed — it's a flat ₹ add-on
  const marginFromDealerBase = resolveToPaise("fixed", 60, purchasePaise);
  const marginFromMrpBase = resolveToPaise("fixed", 60, mrpPaise);
  assert.equal(marginFromDealerBase, 6_000);
  assert.equal(marginFromDealerBase, marginFromMrpBase);

  const visitorPaise = purchasePaise + marginFromDealerBase;
  assert.equal(visitorPaise, 66_000);
  assert.equal(visitorDiscountPct(mrpPaise, visitorPaise), 34);
});

test("percent-mode margin scales with dealer price, not with MRP", () => {
  const mrpPaise = 1000 * 100;
  // same 10% margin rate, cheaper dealer price → smaller margin amount,
  // which would NOT be true if margin were still based on MRP
  const cheapDealerPaise = resolveToPaise("fixed", 400, mrpPaise);
  const marginPaise = resolveToPaise("percent", 10, cheapDealerPaise);
  assert.equal(marginPaise, 4_000); // ₹40 (10% of ₹400), not ₹100 (10% of ₹1000)
});

test("visitor discount floors at 0% when selling price meets or exceeds MRP", () => {
  const mrpPaise = 1000 * 100;
  assert.equal(visitorDiscountPct(mrpPaise, mrpPaise), 0);
  assert.equal(visitorDiscountPct(mrpPaise, mrpPaise + 50_00), 0);
});

test("resolveToPaise rejects negative/non-finite values", () => {
  assert.equal(resolveToPaise("percent", -5, 100_00), 0);
  assert.equal(resolveToPaise("fixed", NaN, 100_00), 0);
});

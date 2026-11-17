/* ============================================================
   Buyer organisation types — SERVER-SAFE shared module (no
   "use client"). Single source of truth for the four buyer
   categories that drive buyer-category discounts, and the
   mapping from an organisation's VERIFIED `orgType` field to one
   of those four buckets.

   The discount model keys off these buckets, never off client-
   submitted data: the engine normalises `organizations.orgType`
   (set from the registration form and owned by the org record)
   into exactly one BuyerTypeKey.

   Registration collects orgType ∈ {School, College, Academy,
   Retailer, Other institution}. The buckets collapse School +
   College into "Schools & Colleges"; anything unrecognised falls
   through to "Other Institutions" so no approved buyer is ever
   left without a defined bucket.
   ============================================================ */

export type BuyerTypeKey =
  | "schools-colleges"
  | "sports-academies"
  | "retail-shops"
  | "other-institutions";

export interface BuyerType {
  key: BuyerTypeKey;
  label: string;
  /** lower-cased orgType tokens that map into this bucket */
  matches: string[];
}

/** The four buyer categories, in display order. "Other Institutions" is the
 *  catch-all and matches anything not claimed by the first three. */
export const BUYER_TYPES: readonly BuyerType[] = [
  { key: "schools-colleges", label: "Schools & Colleges", matches: ["school", "college"] },
  { key: "sports-academies", label: "Sports Academies", matches: ["academy"] },
  { key: "retail-shops", label: "Retail Shops", matches: ["retail", "retailer", "shop"] },
  { key: "other-institutions", label: "Other Institutions", matches: [] },
];

export const BUYER_TYPE_LABEL: Record<BuyerTypeKey, string> = Object.fromEntries(
  BUYER_TYPES.map((t) => [t.key, t.label])
) as Record<BuyerTypeKey, string>;

export const BUYER_TYPE_KEYS: readonly BuyerTypeKey[] = BUYER_TYPES.map((t) => t.key);

export function isBuyerTypeKey(v: string): v is BuyerTypeKey {
  return (BUYER_TYPE_KEYS as readonly string[]).includes(v);
}

/** Normalise a verified organisation `orgType` into one of the four buckets.
 *  Unknown / empty values resolve to "other-institutions" (never throws). */
export function normalizeBuyerType(orgType: string | null | undefined): BuyerTypeKey {
  const t = (orgType ?? "").trim().toLowerCase();
  for (const bt of BUYER_TYPES) {
    if (bt.matches.some((m) => t.includes(m))) return bt.key;
  }
  return "other-institutions";
}

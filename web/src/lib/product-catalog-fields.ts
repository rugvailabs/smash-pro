/** ADR-0015: pure validation for the optional, admin-entered supplier
 *  stock-sheet fields — supplier item code, MSP, colour, size. Shared by
 *  server/admin.ts (authoritative, server-side) and tests, same pattern
 *  as product-tax-fields.ts / pricing-calc.ts. Format/length checks only
 *  — never a business rule about what these values should mean. */

function normalizeOptionalText(value: unknown, maxLen: number, label: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new Error(`400:${label} must be text`);
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (trimmed.length > maxLen) throw new Error(`400:${label} must be ${maxLen} characters or fewer`);
  return trimmed;
}

/** The original vendor/supplier item code (e.g. a LI-NING or HUNDRED stock
 *  sheet code) — free text, distinct from this app's own `sku`. */
export function normalizeSupplierCode(value: unknown): string | null {
  return normalizeOptionalText(value, 60, "Supplier item code");
}

/** Free-text colour/colourway — not a structured variant dimension. */
export function normalizeColor(value: unknown): string | null {
  return normalizeOptionalText(value, 120, "Color");
}

/** Free-text size — shoe/apparel/grip sizes all share this one field;
 *  format is never validated or converted. */
export function normalizeSize(value: unknown): string | null {
  return normalizeOptionalText(value, 40, "Size");
}

/** ADR-0016 — the buyer-facing variant grouping key. Free text, never
 *  validated against anything beyond length; admin/importer is solely
 *  responsible for which rows share one. */
export function normalizeGroupKey(value: unknown): string | null {
  return normalizeOptionalText(value, 60, "Group key");
}

/** MSP (a third reference price point some supplier sheets carry, between
 *  Dealer Price and MRP). Entered directly in rupees, same sanity bounds
 *  as MRP/std (₹0.01–₹10,00,000); optional. Returns paise. */
export function normalizeMsp(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0.01 || value > 1_000_000) {
    throw new Error("400:MSP must be between ₹0.01 and ₹10,00,000");
  }
  return Math.round(value * 100);
}

/** The product SKU — free-hand entry, no required category-prefix format.
 *  Admin can type with or without a hyphen/case ("cr1200", "CR1200") and it
 *  normalizes to the conventional `LETTERS-DIGITS` display ("CR-1200"); a
 *  pure-digit SKU ("3455") is left as-is, no letters to hyphenate. Anything
 *  that doesn't fit that shape is kept verbatim (trimmed, uppercased) —
 *  this is deliberately not validated against any category/prefix scheme,
 *  that's admin judgement, not a system rule (see nextSkuSequence for the
 *  separate, still-strict auto-numbering used by bulk Excel import). */
export function normalizeSku(value: unknown): string {
  if (typeof value !== "string") throw new Error("400:SKU is required");
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, "");
  if (!cleaned) throw new Error("400:SKU is required");
  if (cleaned.length > 40) throw new Error("400:SKU must be 40 characters or fewer");
  const m = /^([A-Z]*)-?(\d+)$/.exec(cleaned);
  if (!m) return cleaned;
  const [, letters, digits] = m;
  return letters ? `${letters}-${digits}` : digits;
}

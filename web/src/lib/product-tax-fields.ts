/** ADR-0014: pure validation for the optional, admin-entered HSN code and
 *  GST % record-keeping fields. Shared by server/admin.ts (authoritative,
 *  server-side) and this module's tests — same pattern as pricing-calc.ts.
 *  Deliberately format/range checks ONLY — never a tax classification or
 *  rate-correctness decision, which stays pending OBD-11/OBD-20
 *  professional validation. */

/** Trims and validates an HSN/SAC code: optional, 4–8 digits when present
 *  (the standard HSN/SAC code length). Throws on an out-of-format value;
 *  returns null for an absent/empty one. */
export function normalizeHsn(hsn: unknown): string | null {
  if (hsn === undefined || hsn === null) return null;
  if (typeof hsn !== "string") throw new Error("400:HSN code must be text");
  const trimmed = hsn.trim();
  if (trimmed === "") return null;
  if (!/^\d{4,8}$/.test(trimmed)) {
    throw new Error("400:HSN code must be 4 to 8 digits");
  }
  return trimmed;
}

/** Validates a GST % entry: optional, 0–100 when present. Throws on an
 *  out-of-range/non-numeric value; returns null for an absent one. Rounds
 *  to 2 decimal places. */
export function normalizeGstPercent(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("400:GST percentage must be a number between 0 and 100");
  }
  return Math.round(value * 100) / 100;
}

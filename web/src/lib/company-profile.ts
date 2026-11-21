/** SMASH PRO's own registration details — as the BUYER/consignee party on a
 *  supplier's incoming tax invoice, and (ADR-0018 amendment, OBD-22) as the
 *  single warehouse/pickup address shown to buyers who choose self-pickup
 *  or a self-arranged courier. Sourced directly from the owner's own GST
 *  invoices already on file (not invented, not derived from any policy
 *  decision). Update here if registration details or the warehouse address
 *  change. Not server-only — safe to import from client components too
 *  (plain data, no DB/session access). */
export const SMASH_PRO_PROFILE = {
  legalName: "SMASH PRO",
  address:
    "NO 124, SHOP NO 001, K NO 36, 1ST FLOOR, SM COMPLEX, MARGONDANAHALLI MAIN ROAD, " +
    "OPP DIAMOND PRE UNIVERSITY, BENGALURU-560036",
  gstin: "29AWOPK0837F3Z9",
  pan: "AWOPK0837F",
  stateCode: "29",
  stateName: "Karnataka",
  phone: "7204570468",
} as const;

/** OBD-22 — the single warehouse pickup location, now confirmed (was a
 *  PENDING CONFIRMATION placeholder). Shown to a buyer who chooses
 *  self-pickup (collect in person) or a self-arranged courier (hand this
 *  address to Porter/Rapido/Uber, etc.) — never the supplier's own address,
 *  which stays internal to Smash Pro ops. */
export const SMASH_PRO_PICKUP_ADDRESS =
  `${SMASH_PRO_PROFILE.legalName}, ${SMASH_PRO_PROFILE.address} · ` +
  `Mob: ${SMASH_PRO_PROFILE.phone}`;

/** First two digits of a GSTIN are the state code (structural fact, not a
 *  tax-policy decision) — used only to suggest CGST+SGST vs IGST, which the
 *  admin can always override. */
export function gstinStateCode(gstin: string): string | null {
  const m = gstin.trim().match(/^(\d{2})/);
  return m ? m[1] : null;
}

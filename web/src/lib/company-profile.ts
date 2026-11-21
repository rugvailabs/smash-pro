/** SMASH PRO's own registration details — as the BUYER/consignee party on a
 *  supplier's incoming tax invoice. Sourced directly from the owner's own
 *  GST invoices already on file (not invented, not derived from any policy
 *  decision); used only to pre-fill the buyer letterhead block when
 *  recording a supplier invoice. Update here if registration details change. */
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

/** First two digits of a GSTIN are the state code (structural fact, not a
 *  tax-policy decision) — used only to suggest CGST+SGST vs IGST, which the
 *  admin can always override. */
export function gstinStateCode(gstin: string): string | null {
  const m = gstin.trim().match(/^(\d{2})/);
  return m ? m[1] : null;
}

/** SMASH PRO's own registration/contact details — as the BUYER/consignee
 *  party on a supplier's incoming tax invoice, as (ADR-0018 amendment,
 *  OBD-22) the single warehouse/pickup address shown to buyers who choose
 *  self-pickup or a self-arranged courier, and as the real public contact
 *  info shown site-wide (footer, Support page, product enquiry). Address
 *  and phone confirmed directly by the owner (matches the public Google
 *  Business listing) — not invented, not derived from any policy decision.
 *  Update here if registration details or the shop/warehouse address
 *  change. Not server-only — safe to import from client components too
 *  (plain data, no DB/session access). */
export const SMASH_PRO_PROFILE = {
  legalName: "SMASH PRO",
  address:
    "SM COMPLEX, SHOP NO. 06, 27/10, MARAGONDANAHALLI MAIN ROAD, " +
    "KITHIGANUR, BENGALURU-560036",
  gstin: "29AWOPK0837F3Z9",
  pan: "AWOPK0837F",
  stateCode: "29",
  stateName: "Karnataka",
  phone: "7204570648",
  /** Store hours as listed on Smash Pro's Google Business Profile. */
  hours: "Mon–Fri 10:00 AM–9:00 PM · Sat–Sun 9:00 AM–9:00 PM",
} as const;

/** OBD-22 — the single warehouse pickup location, now confirmed (was a
 *  PENDING CONFIRMATION placeholder). Shown to a buyer who chooses
 *  self-pickup (collect in person) or a self-arranged courier (hand this
 *  address to Porter/Rapido/Uber, etc.) — never the supplier's own address,
 *  which stays internal to Smash Pro ops. */
export const SMASH_PRO_PICKUP_ADDRESS =
  `${SMASH_PRO_PROFILE.legalName}, ${SMASH_PRO_PROFILE.address} · ` +
  `Mob: ${SMASH_PRO_PROFILE.phone}`;

/** E.164-ish digits (country code + 10-digit number, no symbols) — the only
 *  form wa.me and tel: links accept reliably. Derived, not re-typed, so the
 *  phone number only ever needs updating in one place. */
const SMASH_PRO_PHONE_DIGITS = `91${SMASH_PRO_PROFILE.phone}`;
export const SMASH_PRO_WHATSAPP_LINK = `https://wa.me/${SMASH_PRO_PHONE_DIGITS}`;
export const SMASH_PRO_TEL_LINK = `tel:+${SMASH_PRO_PHONE_DIGITS}`;
export const SMASH_PRO_PHONE_DISPLAY = `+91 ${SMASH_PRO_PROFILE.phone.slice(0, 5)} ${SMASH_PRO_PROFILE.phone.slice(5)}`;
/** Opens the address directly in Google Maps — no API key needed for a
 *  plain search-by-text link. */
export const SMASH_PRO_MAPS_LINK =
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SMASH_PRO_PROFILE.legalName}, ${SMASH_PRO_PROFILE.address}`)}`;

/** First two digits of a GSTIN are the state code (structural fact, not a
 *  tax-policy decision) — used only to suggest CGST+SGST vs IGST, which the
 *  admin can always override. */
export function gstinStateCode(gstin: string): string | null {
  const m = gstin.trim().match(/^(\d{2})/);
  return m ? m[1] : null;
}

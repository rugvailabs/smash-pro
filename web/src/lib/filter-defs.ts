/* ============================================================
   Catalogue filter definitions — SERVER-SAFE shared module.
   Imported by both the client filter bar (catalog-filters.tsx)
   and the server catalogue page. These constants must not live
   in a "use client" module: across the RSC boundary a client
   module's exports become client references, and the server
   would read PRICE_BANDS[price] as undefined — silently
   disabling the band filter (T3 review, Finding 1).
   Bands filter the public standard listed price (OBD-03);
   values are presentation choices, not pricing rules.
   ============================================================ */

export const PRICE_BANDS: Record<string, { label: string; min: number; max: number }> = {
  "lt1000": { label: "Under ₹1,000", min: 0, max: 999.99 },
  "1000-2500": { label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  "2500-5000": { label: "₹2,500 – ₹5,000", min: 2500, max: 5000 },
  "gt5000": { label: "Over ₹5,000", min: 5000.01, max: Infinity },
};

export const SORTS: Record<string, string> = {
  relevance: "Relevance",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name A–Z",
};

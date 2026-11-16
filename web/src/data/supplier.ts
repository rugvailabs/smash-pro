import type {
  CostProposal, SupplierPO, SupplierProfile, SupplierQuote, SupplierRequirement, SupplyItem,
} from "@/lib/types";

/** SAMPLE DATA — supplier workspace preview (Phase D). All values illustrative.
 *  Consumed only via src/lib/supplier-api.ts (the future API boundary).
 *  Access boundaries §3: no buyer identities, no requirement origins, no
 *  competing quotations or other suppliers ever appear in this dataset.
 *  Direct-shipment POs carry ONLY the Minimum Delivery Information (OBD-19). */

export const SUPPLIER: SupplierProfile = {
  name: "Meerut Sports Works",
  legalName: "Meerut Sports Works Pvt. Ltd.",
  type: "Manufacturer",
  gstin: "09AAFCM2210R1ZQ",
  contact: "Sales Head · 98111 20410",
  email: "sales@meerutsportsworks.example",
  worksAddress: "Plot 14, Sports Goods Complex, Meerut 250002",
  categories: ["Cricket", "Athletics", "Gym & Fitness"],
  documents: [
    { file: "gst-certificate.pdf", state: "On file" },
    { file: "pan-card.pdf", state: "On file" },
    { file: "udyam-registration.pdf", state: "On file" },
  ],
  directApproved: true,
  directEnabled: [
    ["Adjustable hurdles", "Enabled"],
    ["Medicine Ball 5 kg", "Enabled"],
  ],
};

export const REQUIREMENTS: SupplierRequirement[] = [
  {
    id: "REQ-2026-0091",
    title: "Adjustable training hurdles — set of 6 heights",
    category: "Athletics", qty: "120 units", destination: "ProSmash warehouse",
    published: "11 Nov 2026", closes: "today 18:00", closesToday: true,
    status: "open", statusLabel: "Open · not quoted",
    spec: [
      ["Product", "Adjustable training hurdles, 6 height positions (60–106 cm)"],
      ["Construction", "Powder-coated steel frame · collapsible top bar"],
      ["Standard", "School & academy training grade"],
      ["Quantity", "120 units"],
      ["Required by", "20 Dec 2026"],
      ["Deliver to", "ProSmash warehouse"],
    ],
    requiredBy: "20 Dec 2026",
    attachments: [{ file: "hurdle-spec-drawing.pdf", meta: "PDF · 2 pages" }],
  },
  {
    id: "REQ-2026-0089",
    title: "Rubber-coated dumbbell sets — 5–30 kg pairs",
    category: "Gym & Fitness", qty: "40 sets", destination: "ProSmash warehouse",
    closes: "19 Nov",
    status: "quoted-revision", statusLabel: "Quoted · revision requested",
  },
  {
    id: "REQ-2026-0087",
    title: "English Willow Bats — Grade 2, short handle",
    category: "Cricket", qty: "500", destination: "ProSmash warehouse",
    closes: "closed 13 Nov",
    status: "awarded", statusLabel: "Awarded to you",
    poId: "PO-2026-00412",
  },
  {
    id: "REQ-2026-0084",
    title: "Competition shot puts — 4 kg / 7.26 kg",
    category: "Athletics", qty: "60", destination: "ProSmash warehouse",
    closes: "closed 09 Nov",
    status: "closed", statusLabel: "Closed",
  },
];

export const QUOTES: SupplierQuote[] = [
  {
    reqId: "REQ-2026-0089",
    title: "Rubber-coated dumbbell sets — 5–30 kg pairs",
    category: "Gym & Fitness", qty: "40 sets", closes: "19 Nov",
    statusLabel: "Revision requested",
    unit: 21400, quantity: "40 sets", lead: "30 days",
    validTill: "10 Dec 2026", terms: "40% adv, bal. on delivery",
    attachments: 1,
    versions: [
      { v: "v2", unit: 21400, summary: "lead time improved to 30 days", date: "12 Nov 2026", current: true },
      { v: "v1", unit: 21400, summary: "initial submission, 45-day lead", date: "11 Nov 2026" },
    ],
    thread: [
      {
        from: "prosmash", meta: "PROSMASH · 12 Nov 2026, 15:04 · re: v1",
        text: "Thanks for the quote. The quantity and pricing work, but 45-day lead time is beyond our requirement window. Can you improve it?",
      },
      {
        from: "you", meta: "YOU · 12 Nov 2026, 17:40",
        text: "We can commit to 30 days if the PO is released by 25 Nov — revised offer submitted as v2.",
      },
      { from: "system", meta: "", text: "ProSmash requested a revision · 13 Nov 2026, 10:12 · re: v2" },
      {
        from: "prosmash", meta: "PROSMASH · 13 Nov 2026, 10:12 · re: v2",
        text: "30 days noted. One more ask: can you hold validity to 20 Dec? Please revise validity only — price and lead time stand.",
      },
    ],
  },
];

export const POS: SupplierPO[] = [
  {
    id: "PO-2026-00412", destination: "warehouse", issued: "13 Nov 2026",
    lineName: "English Willow Bat — Grade 2, Short Handle",
    lineQty: 500, unit: 3980, value: 1990000,
    fulfilment: "acknowledged", fulfilmentLabel: "Acknowledged",
    dispatchBy: "04 Dec 2026", acknowledgedAt: "13 Nov 2026, 17:02",
    dispatchedQty: "0 of 500", receivedQty: "0 of 500",
    awardedFrom: { reqId: "REQ-2026-0087", version: "v3" },
    terms: { unit: 3980, qty: 500, lead: "21 days", validTill: "15 Dec 2026", payment: "50% adv, bal. on delivery" },
    paymentTerms: "50% adv, bal. on delivery",
    received: 995000, outstanding: 995000, payStatusLabel: "Balance on delivery",
  },
  {
    id: "PO-2026-00425", destination: "direct", issued: "11 Nov 2026",
    lineName: "Adjustable training hurdles — set of 6 heights",
    lineQty: 24, unit: 2240, value: 53760,
    fulfilment: "awaiting-proof", fulfilmentLabel: "Awaiting delivery proof",
    paymentTerms: "On delivery",
    received: 0, outstanding: 53760, payStatusLabel: "Awaiting delivery closure",
    minDeliveryInfo: [
      ["Recipient name", "Receiving Store — Model College"],
      ["Phone", "98XXX 22410"],
      ["Delivery address", "Store Block B, College Campus, Nagpur 440010"],
      ["Product", "Adjustable training hurdles — set of 6 heights"],
      ["Quantity", "24"],
      ["Delivery instructions", "Deliver 09:00–16:00 working days; obtain store stamp"],
      ["PO reference", "PO-2026-00425"],
    ],
    shipment: { dispatched: "13 Nov 2026", lr: "LR-90233", qtyShipped: "24 of 24" },
  },
  {
    id: "PO-2026-00418", destination: "direct", issued: "08 Nov 2026",
    lineName: "Medicine Ball — Rubber, 5 kg",
    lineQty: 12, unit: 1490, value: 17880,
    fulfilment: "delivered-proof", fulfilmentLabel: "Delivered · proof on record",
    paymentTerms: "On delivery",
    received: 17880, outstanding: 0, payStatusLabel: "Paid",
    shipment: { dispatched: "09 Nov 2026", lr: "LR-88102", qtyShipped: "12 of 12" },
  },
  {
    id: "PO-2026-00371", destination: "warehouse", issued: "12 Oct 2026",
    lineName: "Practice Net — 60 × 10 ft, HDPE",
    lineQty: 60, unit: 2900, value: 174000,
    fulfilment: "closed", fulfilmentLabel: "Received in full · closed",
    paymentTerms: "On delivery",
    received: 174000, outstanding: 0, payStatusLabel: "Paid",
  },
];

export const PAYMENT_RECORDS = [
  { title: "Payment received — PO-2026-00412 advance", meta: "13 Nov 2026 · ₹9,95,000.00" },
  { title: "Payment received — PO-2026-00418 full", meta: "14 Nov 2026 · ₹17,880.00" },
];

export const SUPPLY_ITEMS: SupplyItem[] = [
  { name: "English Willow Bat — Grade 2, SH", category: "Cricket", capacity: "800", lead: "21 days", cost: 3980, proposal: "₹4,080.00 proposed · awaiting ProSmash decision" },
  { name: "Kashmir Willow Bat — Match, FS", category: "Cricket", capacity: "1,500", lead: "14 days", cost: 1310 },
  { name: "Practice Net — 60×10 ft HDPE", category: "Cricket", capacity: "200", lead: "10 days", cost: 2900 },
  { name: "Adjustable Training Hurdles — 6 ht", category: "Athletics", capacity: "600", lead: "18 days", cost: 2240 },
  { name: "Medicine Ball — Rubber, 5 kg", category: "Gym & Fitness", capacity: "2,000", lead: "7 days", cost: 1490 },
];

export const COST_PROPOSALS: CostProposal[] = [
  {
    title: "English Willow Bat G2 — ₹3,980.00 → ₹4,080.00",
    detail: "Submitted 12 Nov 2026 · reason: willow input cost increase · requested effective: next PO",
    statusLabel: "Awaiting ProSmash decision",
  },
  {
    title: "Practice Net — ₹3,050.00 → ₹2,900.00",
    detail: "Submitted 02 Oct 2026 · accepted by ProSmash 05 Oct 2026",
    statusLabel: "Accepted", accepted: true,
  },
];

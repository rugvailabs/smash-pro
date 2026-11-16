import type { BuyerRequest, Institution, Order } from "@/lib/types";

/** SAMPLE DATA — buyer commerce preview (Phase C). All values illustrative.
 *  Consumed only via src/lib/buyer-api.ts (the future API boundary).
 *  Access boundaries §3: no supplier identity, cost, quotation or margin
 *  appears anywhere in this dataset — direct shipments are presented as
 *  ProSmash's own (the buyer transacts with ProSmash only). */

export const INSTITUTION: Institution = {
  name: "St. Xavier's High School",
  city: "Pune",
  legalName: "St. Xavier's High School Education Society",
  orgType: "School",
  gstin: "27AABCS1429B1Z6",
  contact: "Head of Sports · 98220 41400",
  email: "sports@stxaviers-pune.example",
  buyerCategory: "School",
  addresses: [
    {
      label: "Sports Department — Main Campus",
      detail: "St. Xavier's High School, 24 Residency Road, Pune 411001 · Attn: Head of Sports · 98220 41400",
      isDefault: true,
    },
    {
      label: "Junior Wing Store",
      detail: "St. Xavier's Junior Wing, 7 Lane C, Koregaon Park, Pune 411001",
    },
  ],
  documents: [
    { file: "gst-certificate.pdf", state: "On file" },
    { file: "affiliation-letter.pdf", state: "On file" },
  ],
};

export const ORDERS: Order[] = [
  {
    id: "ORD-2026-01153",
    placed: "14 Nov 2026",
    status: "placed",
    statusLabel: "Placed",
    direct: false,
    lines: [
      { sku: "CR-0417", name: "English Willow Bat — Grade 2, Short Handle", unit: 4122.5, qty: 24 },
      { sku: "BD-1104", name: "Feather Shuttlecocks — Tournament, Tube of 12", unit: 1054, qty: 30 },
    ],
    subtotalExGst: 116630, gst: 13930, shipping: 1200, total: 131760,
    payment: {
      method: "NEFT",
      status: "awaiting-verification",
      statusLabel: "Awaiting verification",
      reference: "N2026111412345678",
      proofFile: "neft-utr-receipt-14nov.pdf",
      proofUploadedAt: "14 Nov 2026, 10:42",
      declaredAmount: 131760,
    },
    shipTo: "Sports Department — Main Campus, Pune 411001",
    rail: [
      { label: "Placed", date: "14 Nov", state: "cur" },
      { label: "Confirmed", state: "todo" },
      { label: "Processing", state: "todo" },
      { label: "Dispatched", state: "todo" },
      { label: "Delivered", state: "todo" },
    ],
  },
  {
    id: "ORD-2026-01148",
    placed: "13 Nov 2026",
    status: "processing",
    statusLabel: "Processing",
    direct: false,
    lines: [
      { sku: "SW-3001", name: "Polyester Match Jersey Set — Team of 11", unit: 4862, qty: 6 },
      { sku: "BB-0101", name: "Competition Basketball — Size 7, Indoor/Outdoor", unit: 1683, qty: 10 },
      { sku: "BD-1104", name: "Feather Shuttlecocks — Tournament, Tube of 12", unit: 1054, qty: 5 },
    ],
    subtotalExGst: 45782, gst: 5490, shipping: 1200, total: 52472,
    payment: {
      method: "UPI",
      status: "confirmed",
      statusLabel: "Payment confirmed",
      reference: "TXN-UPI-889034",
      confirmedAt: "13 Nov 2026, 11:52",
    },
    shipTo: "Sports Department — Main Campus, Pune 411001",
    rail: [
      { label: "Placed", date: "13 Nov", state: "done" },
      { label: "Confirmed", date: "13 Nov", state: "done" },
      { label: "Processing", date: "13 Nov", state: "cur" },
      { label: "Dispatched", state: "todo" },
      { label: "Delivered", state: "todo" },
    ],
  },
  {
    id: "ORD-2026-01144",
    placed: "10 Nov 2026",
    status: "confirm-receipt",
    statusLabel: "Confirm receipt",
    direct: true,
    lines: [
      { sku: "VB-0231", name: "Volleyball — Match, Size 5", unit: 1915, qty: 12 },
    ],
    subtotalExGst: 20518, gst: 2462, shipping: 1200, total: 24180,
    payment: {
      method: "UPI",
      status: "confirmed",
      statusLabel: "Payment confirmed",
      reference: "TXN-UPI-884120",
      confirmedAt: "10 Nov 2026, 09:18",
    },
    shipTo: "Sports Department — Main Campus, Pune 411001",
    dispatched: "12 Nov 2026",
    transportRef: "LR-88412",
    deliveredOn: "13 Nov 2026",
    deliveryProofOnRecord: true,
    receiptConfirmed: false,
    rail: [
      { label: "Placed", date: "10 Nov", state: "done" },
      { label: "Confirmed", date: "10 Nov", state: "done" },
      { label: "Processing", date: "11 Nov", state: "done" },
      { label: "Dispatched", date: "12 Nov", state: "done" },
      { label: "Delivered — confirm receipt", date: "13 Nov", state: "cur" },
    ],
  },
  {
    id: "ORD-2026-01132",
    placed: "02 Nov 2026",
    status: "delivered",
    statusLabel: "Delivered",
    direct: false,
    lines: [
      { sku: "CR-0417", name: "English Willow Bat — Grade 2, Short Handle", unit: 4122.5, qty: 6 },
      { sku: "CR-0512", name: "Leather Match Ball — 4-Piece Red, Box of 6", unit: 2499, qty: 6 },
      { sku: "CR-0613", name: "Batting Pads — Youth, Ambidextrous Pair", unit: 1122, qty: 12 },
      { sku: "CR-0624", name: "Batting Gloves — Match Grade, Right Hand", unit: 833, qty: 12 },
    ],
    subtotalExGst: 56429, gst: 6760, shipping: 1200, total: 64389,
    payment: {
      method: "Net Banking",
      status: "confirmed",
      statusLabel: "Payment confirmed",
      reference: "TXN-NB-771204",
      confirmedAt: "02 Nov 2026, 15:06",
    },
    shipTo: "Sports Department — Main Campus, Pune 411001",
    dispatched: "05 Nov 2026",
    transportRef: "LR-86019",
    deliveredOn: "07 Nov 2026",
    rail: [
      { label: "Placed", date: "02 Nov", state: "done" },
      { label: "Confirmed", date: "02 Nov", state: "done" },
      { label: "Processing", date: "03 Nov", state: "done" },
      { label: "Dispatched", date: "05 Nov", state: "done" },
      { label: "Delivered", date: "07 Nov", state: "done" },
    ],
  },
  {
    id: "ORD-2026-01118",
    placed: "18 Oct 2026",
    status: "cancelled",
    statusLabel: "Cancelled",
    direct: false,
    lines: [
      { sku: "CR-0705", name: "Cricket Helmet — Steel Grille, Size M", unit: 1496, qty: 4 },
      { sku: "CR-0901", name: "Practice Net — 60 × 10 ft, HDPE", unit: 2958, qty: 1 },
    ],
    subtotalExGst: 7992, gst: 950, shipping: null, total: 8942,
    payment: {
      method: "Card",
      status: "cancelled-unpaid",
      statusLabel: "Cancelled — unpaid",
    },
    shipTo: "Sports Department — Main Campus, Pune 411001",
    rail: [
      { label: "Placed", date: "18 Oct", state: "done" },
      { label: "Payment window closed", date: "20 Oct", state: "done" },
      { label: "Cancelled — stock released", date: "20 Oct", state: "cur" },
    ],
  },
];

export const REQUESTS: BuyerRequest[] = [
  {
    id: "REQ-2026-0121",
    title: "Pole vault landing mat — 5×4 m competition",
    category: "Athletics", qty: 1, neededBy: "20 Jan 2027",
    submitted: "08 Nov 2026",
    status: "in-review", statusLabel: "In sourcing review",
  },
  {
    id: "REQ-2026-0104",
    title: "Table tennis robot trainer",
    category: "Indoor Games", qty: 2,
    submitted: "21 Oct 2026",
    status: "available", statusLabel: "Now available in catalogue",
  },
  {
    id: "REQ-2026-0097",
    title: "Custom embroidered team blazers",
    category: "Sportswear", qty: 40,
    submitted: "12 Oct 2026",
    status: "declined", statusLabel: "Declined",
  },
];

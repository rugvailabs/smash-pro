# ProSmash — Project Vision

> Status: Draft for owner review · Market: India · Last updated: 2026-11-13

## 1. Business Concept

ProSmash is an India-focused **B2B sports commerce platform** that connects
institutional buyers of sports goods with a verified supply network of
manufacturers, wholesalers, distributors and dealers.

ProSmash is not a listing directory and not a consumer storefront. It operates as a
**managed B2B marketplace with hybrid fulfilment** (confirmed — OBD-01): the
ProSmash operations team (Super Admin) curates the catalog and sources from
approved suppliers through a structured procurement and quotation process.
Fulfilment then varies by product and supplier:

- **Warehouse fulfilment** — ProSmash purchases and stocks selected products in
  its own warehouse and ships buyer orders from stock.
- **Supplier direct shipment** — selected products from eligible suppliers ship
  directly from the supplier to the buyer. Not all suppliers are eligible
  (eligibility rules: `PENDING CONFIRMATION`, OBD-19).

In both paths, **ProSmash manages the buyer relationship and the order process
end to end** — buyers get one professional counterparty, ProSmash, instead of
negotiating with dozens of unverified traders. Direct-shipment governance is
largely decided (OBD-19: dual admin approval of supplier and product,
admin-set per-order shipping charges, minimum delivery-information disclosure,
ProSmash-only complaint handling, proof-first delivery confirmation); remaining
operational details (liability, charge economics, GST documentation) are
◇ PROPOSED / `PENDING CONFIRMATION` — see OBD-19 in
`../02-requirements/OPEN-BUSINESS-DECISIONS.md`.

## 2. Business Objectives

1. **Become the default procurement channel** for institutional sports purchasing
   in India — schools, academies, colleges and retailers.
2. **Aggregate demand** from many institutions to negotiate wholesale pricing
   from manufacturers and distributors.
3. **Professionalize supply**: every supplier is verified and admin-approved;
   every quotation and negotiation is recorded on-platform.
4. **Guarantee fulfilment quality** by owning the order process end to end —
   warehousing and dispatching selected products directly, and permitting
   supplier direct shipment only for selected products from vetted, eligible
   suppliers.
5. **Capture the full trade loop** digitally: requirement → quotation →
   negotiation → procurement → inventory → buyer order → payment → supplier
   settlement.
6. **Serve demand beyond the catalog** through buyer product requests that feed
   directly into the procurement pipeline.

Commercial targets (revenue, margin, GMV, category coverage): `PENDING CONFIRMATION`.

## 3. Target Customers (Business Buyers)

| Segment | Typical purchasing behaviour |
|---|---|
| Schools | Annual/term-based bulk purchases; sports-day and PE equipment; budget approval cycles |
| Sports academies | Discipline-specific, recurring replenishment; higher quality grades |
| Colleges & universities | Tenders and committee-driven purchasing; large one-time orders |
| Retailers | Wholesale restocking across categories; price-sensitive, frequent orders |
| Other institutions | Corporates, clubs, government bodies and NGOs purchasing sports goods |

All buyer accounts are **organizational**, not personal, and require admin approval
of the business before transacting (verification criteria: `PENDING CONFIRMATION`).

## 4. Supplier Network

| Supplier type | Role in the network |
|---|---|
| Manufacturers | Source of manufactured goods; best pricing at volume; OEM/custom capability |
| Wholesalers | Multi-brand breadth; fast availability of common SKUs |
| Distributors | Authorized channel for branded goods in a region |
| Dealers | Local availability, small-lot flexibility, niche items |

Network principles:
- Suppliers **self-register but transact only after Super Admin approval**.
- Suppliers declare the **sport categories they serve**; procurement requirements
  are routed to suppliers by category match.
- Suppliers compete through **quotations** (with revisions) against admin-created
  procurement requirements, and negotiate via on-platform messaging.
- Supplier performance (quotation competitiveness, fulfilment reliability) is
  tracked to inform future selection.

## 5. Platform Scope

Three portals on one platform:

1. **Super Admin Portal** — supplier and buyer approvals, catalog and category
   governance, procurement requirements, quotation comparison and selection,
   negotiation messaging, warehouse inventory, buyer order management, payment
   collection oversight, supplier payment tracking, platform configuration.
2. **Supplier Portal** — registration and profile, category subscriptions,
   product information management, procurement-requirement notifications,
   quotation submission and revision, negotiation messaging, awarded-order
   fulfilment, payment status visibility.
3. **Business Buyer Portal** — organization registration, catalog browsing and
   search, pricing visibility, order placement and tracking, requests for
   unlisted products, payment (100% advance before dispatch — OBD-08), order
   history and documents.

**In scope (phase 1):** the fourteen workflows specified in
`../02-requirements/BUSINESS-WORKFLOWS.md`.

**Out of scope (phase 1, revisit later):** consumer (B2C) sales, logistics
marketplace integrations, multi-warehouse, international markets, mobile apps.
`PENDING CONFIRMATION` where any of these is actually desired in phase 1.
(Supplier-to-buyer direct shipment is **in scope** per the hybrid model, OBD-01.)

## 6. Core Value Proposition

**For business buyers** — one verified counterparty, wholesale pricing, a curated
catalog, the ability to request anything not listed, and dependable fulfilment
managed by ProSmash (from its own stock or via vetted supplier direct shipment),
with ProSmash as the single point of contact for any delivery issue (OBD-19) —
replacing fragmented dealer networks, opaque pricing and unreliable delivery.

**For suppliers** — qualified institutional demand at volume, a fair structured
quotation process, direct negotiation with a professional buyer (ProSmash), and
transparent order and payment tracking — replacing cold outreach and informal
credit risk.

**For ProSmash** — margin between negotiated procurement cost and the buyer's
applicable selling price, governed by the confirmed pricing model (OBD-05:
admin-controlled base prices with buyer-category discounts and individual
overrides; calculation mechanics `PENDING CONFIRMATION`, OBD-20; any
supplier-side commission model `PENDING CONFIRMATION`, OBD-14) — plus a
defensible position as the trusted intermediary holding both demand and supply
relationships.

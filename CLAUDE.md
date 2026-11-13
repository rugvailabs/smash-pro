# ProSmash — Project Instructions

## What ProSmash Is
ProSmash is a professional **B2B sports commerce platform** — wholesale and institutional
trade, not a consumer storefront. It connects:

- **Buyers:** schools, sports academies, colleges, retailers, institutional purchasers
- **Suppliers:** manufacturers, wholesalers, distributors, dealers
- **Operators:** the ProSmash Super Admin team

Three application surfaces: **Super Admin**, **Supplier Portal**, **Business Buyer Portal**.

## Confirmed Business Rules
- **Initial target market: India.**
- Two first-class commerce workflows, both equally important:
  1. **Buyer ordering** — business buyers browse/search the catalog and place orders.
  2. **Admin-managed supplier procurement** — the Super Admin team sources and procures
     from suppliers on behalf of the platform.
- **Suppliers can self-register, but require Super Admin approval** before becoming active.

## Unconfirmed Business Policies — `PENDING CONFIRMATION`
The following are owner decisions. Do **not** finalize, implement, or invent rules for them.
Wherever they appear in documents or designs, mark them `PENDING CONFIRMATION`:

- GST / business verification flow and requirements
- MOQ (minimum order quantity) rules
- Pricing formulas and tiered/negotiated pricing logic
- Supplier commission / platform fee model
- Any other commercial policy not listed under Confirmed Business Rules

## Current Stage
Initialization & planning. **No technology stack has been selected.**
Do not install dependencies, scaffold frameworks, or generate application code
until the stack decision is recorded in `docs/03-architecture/`.

## Design Doctrine (non-negotiable)
ProSmash must look like a serious commercial trade platform, not a template.
- Premium, professional, information-dense where B2B workflows demand it.
- **Avoid:** generic AI-generated layouts, decorative gradients, excessive
  rounded cards, repetitive three-column feature grids, stock hero clichés.
- Prefer: strong typographic hierarchy, disciplined spacing, restrained color
  anchored by the brand palette, real product photography over illustration
  in commerce contexts.
- Design decisions live in `docs/04-design-system/` and must be followed once ratified.

## B2B Context — Always Design For
- Wholesale quantities and institutional purchasing patterns — never retail patterns.
  (Specific MOQ and pricing rules: `PENDING CONFIRMATION`.)
- Organizational accounts (an institution has multiple users/roles), not personal accounts.
- Quote/RFQ and purchase-order workflows alongside direct ordering.
- India-market invoicing and business verification concerns
  (exact GST verification policy: `PENDING CONFIRMATION`).

## Directory Rules
- `brand/` and `assets/` are **curated, version-controlled, design-time** assets.
- `media/` is **application-owned runtime** storage — never hand-place files there,
  and never make the app write into `assets/`.
- `assets/references/` is internal inspiration only — never import or ship it.
- No placeholder product images or logos: asset folders stay empty until real,
  approved assets are supplied.
- Follow naming conventions in `docs/ASSET-INVENTORY.md`.

## Working Rules for Claude
1. Never delete or overwrite existing files/assets; add new versions alongside if needed.
2. Record every significant technical decision as a short ADR in `docs/03-architecture/`.
3. When a requirement is ambiguous, ask — do not invent business rules;
   mark open policy questions `PENDING CONFIRMATION`.
4. Keep documentation in `docs/` current as the project evolves.
5. Each development phase requires explicit owner approval before starting the next.

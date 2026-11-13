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

## Business Decisions — Single Source of Truth
`docs/02-requirements/OPEN-BUSINESS-DECISIONS.md` is the authoritative register
of business decisions (OBD-01…OBD-21), with a resolution log of everything the
owner has approved. Many decisions are now CONFIRMED there (hybrid fulfilment,
pricing model and mechanics, 100% advance payment, payment methods,
direct-shipment governance). Rules:

- Treat only register entries marked DECIDED as approved; ◇ PROPOSED items are
  recommendations awaiting owner approval — never implement them as decided.
- Do **not** finalize, implement, or invent rules for items still open there
  (notably: GST rates/HSN and tax documents, business verification
  requirements, MOQ rules, supplier commission model). Mark them
  `PENDING CONFIRMATION`.
- GST/tax/legal items additionally require professional validation before
  implementation, regardless of documentation status.

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
- The **approved design source of truth** (owner-approved 2026-11-13, "Court
  Ink" direction) lives in `docs/04-design-system/` and must be followed:
  BRAND-FOUNDATION.md (positioning/voice), VISUAL-IDENTITY.md
  (colour/type/logo/imagery), DESIGN-STANDARDS.md (tokens/accessibility/
  components), PORTAL-PRINCIPLES.md (per-surface rules),
  UI-PREPARATION-PLAN.md (screens/journeys). Phase 1: light mode only,
  English only. Logo is concept-only until artwork is approved; fonts are not
  acquired yet (record licenses in `brand/fonts/LICENSES.md` at acquisition).

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

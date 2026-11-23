# ADR-0010 — Standalone `decathlon-reference-storefront/` project

> Status: Superseded — project removed 2026-11-23 (owner-directed) · Date: 2026-11-20

**2026-11-23 update:** the owner confirmed this project is no longer needed
and had it deleted. It was never committed to git, so the deletion is
**permanent** — no history to recover it from. This ADR is kept as a record
of the decision; the directory no longer exists.

## Context

Following ADR-0008's `storefront/` build (which reused ProSmash's Court Ink
brand tokens, product data and images), the owner asked for a second,
**completely independent** reference frontend that recreates the structure
and functionality of decathlon.in — explicitly with **no reuse** of
Decathlon's code/assets/branding, and **no reuse** of ProSmash's branding,
product data, images, components, categories or business logic either.
`storefront/` (ADR-0008) is left untouched and unreferenced; this is a
separate, parallel effort, not a replacement.

## Decision

Build a third, fully independent project at `decathlon-reference-storefront/`:

- Next.js (App Router) + TypeScript + Tailwind CSS, own `package.json` and
  `node_modules`, dev server on **port 3009** (`web/`=3007, `storefront/`=3008).
- **No dependency on any other app in this repo** — no shared code, data,
  components, images, or brand tokens with `web/` or `storefront/`.
- New, original placeholder brand identity: **"SportBase"** — green/amber
  palette distinct from both Decathlon's blue and ProSmash's Court Ink.
- Catalogue (~15 sport categories, ~200 SKUs), brand names, and nav taxonomy
  are all original and generated/authored specifically for this project,
  informed by live-site research (structure/UX patterns only, not content).
- Product/category imagery is original, deterministic inline-SVG illustration
  (seeded per product) — no photos, no external downloads, no licensing risk.
- Cart, wishlist, checkout, and account/auth are frontend-only fixtures
  (Zustand + localStorage persistence) — no backend, no DB, no real payment
  or credential handling. Login/registration forms are explicitly labelled
  as demo-only.
- Full page coverage: home, mega-menus (All Sports / Men / Women / Kids),
  category landing pages, PLP with filters/sort, search with autocomplete,
  PDP with variants/reviews, wishlist, cart with coupons, 3-step checkout +
  confirmation, login/register, account/orders/addresses, support/FAQ pages.
  Responsive layout (mobile nav drawer, mobile filter drawer, mobile search).

## Consequences

- Three independent frontend projects now coexist in this repo (`web/`,
  `storefront/`, `decathlon-reference-storefront/`). None depend on each
  other; any future integration/merge decision is out of scope here and
  requires separate owner approval.
- Anything presented as "signed in," "in cart," or "order placed" in this
  project is a local-only UI fixture with no real backend behind it.
- No GST/pricing/business-rule decisions are made or implied — all catalogue
  data is illustrative and replaceable.

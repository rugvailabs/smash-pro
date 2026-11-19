# ADR-0008 — Standalone `storefront/` frontend project

> Status: Accepted (owner-directed) · Date: 2026-11-20

## Context

The owner wants a complete, premium B2B shopping-frontend experience, using
decathlon.in as a UX/structural reference (navigation depth, mega-menu
density, listing/filter patterns, PDP structure, cart/checkout flow) —
explicitly **not** a copy of its proprietary code, protected visual assets,
or branding. The existing `web/` app (ADR-0001/0002/0003/0004) must stay
untouched while this is built and reviewed, since `web/` is a live,
backend-integrated application (Drizzle/Neon, session auth, role-scoped
pricing) that the owner does not want disturbed mid-review.

## Decision

Build a second, fully independent frontend at `storefront/`:

- Next.js (App Router) + TypeScript + Tailwind CSS — same stack family as
  `web/` (ADR-0001), but its own `package.json`, `node_modules`, and dev
  server on **port 3008** (`web/` keeps port 3007).
- **No dependency on `web/`'s backend**: no Drizzle/Neon connection, no
  `server/*` code, no `app/api/*` routes, no session auth. Pricing,
  cart, wishlist, checkout and account state are **frontend fixtures/mocks
  only**, visually and structurally distinct from `web/`'s real
  integrations so the two are never confused.
- Catalogue data starts as a **copy** of `web/src/data/products.ts` (already
  proven DB-independent — it is `web/`'s own seed source) plus a copy of
  `web/public/img/**`. Kept in its own data module so the real catalogue can
  be substituted later without touching UI code.
- Visual identity: Court Ink tokens (`color.brand.*`, type scale, spacing,
  radius caps) copied in as the storefront's own `globals.css`, centrally
  configurable, per DESIGN-STANDARDS.md / VISUAL-IDENTITY.md. Smash Pro
  branding throughout — no Decathlon marks, copy, or imagery.
- Scope: full page coverage (home, nav/mega-menu/search, listing, search
  results, PDP, wishlist, cart, checkout, login/register, account, orders,
  support, footer/info) — built in stages with visual verification per
  stage, not left as placeholders.

## Consequences

- Two Next.js apps coexist in the repo until the owner approves merging the
  reviewed storefront UI back into (or replacing) `web/`'s frontend layer.
  That merge/integration decision is explicitly **out of scope** here and
  requires separate owner approval (per this ADR's originating instruction).
- Anything presented as "signed in," "in cart," "order placed," etc. in
  `storefront/` is a UI fixture, not a real state — must stay visibly
  distinguishable from `web/`'s real backend-integrated behaviour to avoid
  confusing reviewers or, later, real users.
- No GST/pricing/business-rule decisions are made or implied here; the
  storefront reuses whatever illustrative sample data `web/` already has.

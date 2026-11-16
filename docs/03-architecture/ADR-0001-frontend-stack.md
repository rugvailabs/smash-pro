# ADR-0001 — Frontend Technology Stack

> Status: ACCEPTED (owner decision, 2026-11-14)

## Decision
The ProSmash production frontend is built with **Next.js (App Router) +
TypeScript + Tailwind CSS**, living in **`web/`** at the repository root.

## Context
Design previews (static HTML/CSS/JS under `docs/04-design-system/preview/`)
validated the Court Ink design system, the unified-website model and the
Phase A+B interactions. The owner approved the prototype as a visual and
interaction reference and selected the production stack, lifting the
CLAUDE.md "no stack selected" gate.

## Consequences
- Phase A+B is reimplemented as reusable React components and App Router
  pages; the HTML previews remain untouched as visual references.
- Court Ink tokens become the Tailwind theme (single token source).
- Sample data lives apart from UI (`src/data/`), accessed only through
  `src/lib/catalog.ts` async functions — the future API boundary; swapping in
  real endpoints must not touch components.
- Role/cart state are isolated client contexts (preview-grade; real
  authentication replaces the role switcher later).
- Interim imagery is served from `web/public/img/` (copied from
  `preview/img/`, with its LICENSES.md); the governed `assets/` tree stays
  reserved for approved assets.

## Explicitly deferred (owner instruction)
Database (PostgreSQL), ORM (Prisma), authentication providers, payment
integration, and any backend — separate ADRs when decided.

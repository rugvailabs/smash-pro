# ADR-0003 — Database: PostgreSQL on Neon with Drizzle ORM

> Status: Accepted (owner-directed full build, 2026-11-17)

## Decision

**PostgreSQL 18 on Neon** (managed, serverless driver) is the platform
database, in a dedicated Neon project (`prosmash`). Schema and queries are
written with **Drizzle ORM**; migrations with `drizzle-kit`.

## Rationale

- Relational integrity fits the domain (orders, immutable quotation
  versions, audit log); Neon is already connected to this workspace.
- Drizzle keeps the schema in TypeScript beside the app types and generates
  plain SQL migrations that can be reviewed.
- Region `aws-ap-southeast-1` (Singapore) — closest offered region to the
  initial India market and consistent with the owner's other projects.

## Rules

- Money is stored as **integer paise** (`*_paise` columns); the UI renders
  two-decimal ₹ (OBD-20 precision DECIDED; rounding-method detail stays ◇).
- GST **amounts only**: rate/HSN columns exist but remain unpopulated until
  OBD-20/OBD-11 resolve with the tax professional.
- Quotation versions are immutable rows; state transitions append to
  `audit_log` (PLT-003).
- Connection string lives in `web/.env.local` (gitignored); never committed.

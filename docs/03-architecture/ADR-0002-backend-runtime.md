# ADR-0002 — Backend Runtime: Next.js Server Layer

> Status: Accepted (owner-directed full build, 2026-11-17) · Supersedes: none
> Context: master build plan §04 (reviewed 2026-11-17)

## Decision

The backend for the unified public/buyer/supplier website is implemented
inside the existing Next.js application (`web/`) using **route handlers
(`app/api/**`) and server-only modules (`src/server/**`)**. The Super Admin
portal remains a **separate application** (not yet built — tracked as
milestone B5), satisfying PLT-001's hard separation at the app boundary.

## Rationale

- One stack and one deployment skill set; the frontend already runs Next 16.
- The frontend was built against swappable async API boundaries
  (`src/lib/catalog.ts`, `buyer-api.ts`, `supplier-api.ts`); a server layer
  in the same app lets those bodies call server code directly with shared
  TypeScript types — the contract stays in `src/lib/types.ts`.
- Role isolation is enforced **server-side per request** (session → role →
  data scoping), not by client gating (closes the PLT-001 preview caveat).

## Consequences

- `src/server/**` is server-only (no client imports); API route handlers are
  thin wrappers over server services.
- Admin operations needed by decided workflows (payment verification, PO
  issuance, approvals) exist as secured server services + API endpoints now;
  their human UI arrives with the separate admin app (B5).

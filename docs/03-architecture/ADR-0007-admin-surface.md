# ADR-0007 — Super Admin surface lives in the unified Next.js app

> Status: Accepted (owner-directed B5 milestone, 2026-11-17) ·
> amends the "separate admin app" note in ADR-0002

## Decision

The Super Admin Dashboard is built **inside the existing `web/` Next.js app**
under the `/admin` route group, not as a separate application.

- Every `/admin` page and `/api/admin/*` route resolves the session
  server-side and requires the `admin` role (`requireAdmin`, ADR-0004) —
  non-admin sessions get an access gate, never data.
- Admin reads go through `src/lib/admin-api.ts` → `src/server/admin.ts`
  (same boundary pattern as buyer/supplier services); mutations go through
  `/api/admin/*` route handlers with audit-log entries (PLT-003).
- The shared contract types live in `src/lib/admin-types.ts`.

## Rationale

- Shares the session model, Drizzle services, and Court Ink component
  library already in place — no duplicated auth or design plumbing.
- The owner's constraints (no new paid resources, no second deployment)
  make a separate app strictly worse at this stage.
- A later split into a dedicated admin deployment remains possible: the
  `/admin` route group + `server/admin.ts` service boundary is the seam.

## Rules

- Admin UI follows PORTAL-PRINCIPLES §5 (dense queues, Ember rationed,
  audit metadata visible, desktop-first).
- Pending OBD items stay pending in admin surfaces exactly as elsewhere
  (no GST rates/HSN, no commission or settlement schedules, no
  cancellation actions, no OBD-02 verification checklists).

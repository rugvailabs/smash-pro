# ADR-0011 — Visitor buyer self-registration (no approval gate)

> Status: Accepted (owner-directed) · Date: 2026-11-23

## Context

`OPEN-BUSINESS-DECISIONS.md` OBD-03's clarification (DECIDED 2026-11-13) states
that ordering remains approval-gated: registered-but-not-yet-approved buyers
see standard prices only, and only an admin-approved buyer organization can
place orders. The owner directed adding a second, lightweight buyer
registration path — a "normal visitor" — that skips the approval queue
entirely: register, sign in, and order immediately.

## Decision

Add a second buyer registration path, `/register/visitor`, alongside the
existing institutional buyer flow at `/register` (unchanged, still
approval-gated):

- Minimal form: name, phone (optional), email, password — no institution
  name/type, GSTIN or documents.
- `registerOrganization()` (`src/server/registration.ts`) creates the
  organization directly in `active` status (instead of `pending`) when
  `kind === "buyer" && visitor === true`, so no admin approval step is
  needed before ordering.
- `buyerCategory` defaults to `"Visitor"` for this path; no category discount
  is configured for it today, so visitor buyers see standard listed pricing
  (OBD-05/OBD-20 unaffected).
- The institutional buyer flow (`/register`) and the supplier flow
  (`/register/supplier`) are untouched — both still land in `pending` and
  go through admin review (ADM-001/002).

## Consequences

- This is a deliberate, owner-approved carve-out from the OBD-03
  clarification for **this one registration path only** — not a reversal of
  the general rule that institutional buyer/supplier onboarding is
  approval-gated.
- Visitor buyer organizations never appear in the admin "pending approval"
  queue; they appear directly as `active` buyers.
- OBD-02 (business verification requirements) remains open/proposed and is
  explicitly **not** applied to this path — visitor buyers are unverified by
  design.
- If visitor buyers need their own pricing/discount category, eligibility
  limits, or verification later, that is a new decision, not implied here.

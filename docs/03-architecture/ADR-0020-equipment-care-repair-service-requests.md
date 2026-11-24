# ADR-0020 — Equipment Care & Repair service requests

> Status: Accepted (owner-directed) · Date: 2026-11-24

## Context

The owner asked for a "service" entry point beside Support on the
public site, for customers who want equipment inspected or repaired
(initially badminton and cricket gear). No pricing engine, SLA, or
payment flow for repairs exists or was requested — this is a triage
intake, not a transactional checkout.

## Decision

- New public, no-account-required page `/service`: sport (cricket /
  badminton) → care or repair → service checklist → contact details,
  equipment source (new/own), optional photos and a voice note.
- New `service_requests` table stores the submission (contact info,
  selected services, equipment details, uploaded media URLs, status).
- Admin gets a new **Service Requests** queue (`/admin/service-requests`)
  — same triage-list pattern as Complaints: inspect photos/voice note,
  enter a manual quote after physical inspection, move status forward
  (new → quoted → approved → in-progress → completed/declined/cancelled).
- Photo/voice uploads reuse the DigitalOcean Spaces storage path
  established in ADR-0013, under their own key prefix.
- No payment collection is wired to this — quoting happens after
  physical inspection, so no checkout step exists yet. **PENDING
  CONFIRMATION** per CLAUDE.md: whether/how repair quotes are paid is
  an open business decision, not invented here.

## Consequences

- `DO_SPACES_*` credentials must be configured for uploads to actually
  land in storage — without them, the form still submits (service
  request record is created) but photo/voice attachment upload fails.
  Same pre-existing gap as product-photo and site-image uploads.
- Admin enters quotes manually; there is no pricing rule or discount
  engine involvement for repair/care services.
- This is a new workflow surface, not a variant of the existing order
  or complaint workflows — it has its own table, its own admin queue,
  and does not touch orders, invoices, or the pricing engine.

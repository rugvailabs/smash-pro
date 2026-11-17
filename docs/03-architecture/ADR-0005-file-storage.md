# ADR-0005 — File Storage: Deferred Object Storage; Metadata-Only Interim

> Status: Accepted with deferral (2026-11-17)

## Decision

Document/proof **file bytes are not persisted in phase 1**. Upload flows
(registration documents, quotation attachments, delivery proofs) record
**metadata only** (filename, declared type, size, uploader, timestamp) in
the database, exactly mirroring today's prototype semantics but on real
records. S3-compatible private object storage with signed URLs remains the
recorded target; its provider selection is a small follow-up ADR when the
owner picks hosting.

## Rationale

- Avoids committing to a storage vendor before hosting is chosen, while
  letting every decided workflow (proof-first delivery, NEFT proof +
  verification) operate end-to-end on real state.
- OBD-19 ◇ (POD validation/retention) and OBD-02 ◇ are still open — binary
  retention policy follows those decisions.

## Consequences

- UI continues to label uploads as staged metadata; nothing claims bytes
  are retained.
- `media/` stays application-owned and empty until object storage lands.

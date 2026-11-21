# ADR-0013 — Product photo upload storage: DigitalOcean Spaces

> Status: Accepted (owner-directed) · Date: 2026-11-20
> Resolves, for product photography only: the deferred provider
> selection in ADR-0005 ("S3-compatible private object storage... its
> provider selection is a small follow-up ADR when the owner picks
> hosting"). ADR-0005's metadata-only interim stance is otherwise
> UNCHANGED for every other upload surface (registration documents,
> quotation attachments, delivery proofs) — those remain out of scope
> here and need their own follow-up decision if/when extended.

## Context

Admin asked to upload a product photo directly from a PC or mobile
device in the Add Product form, rather than only linking a photo a
human had already placed under `public/img/` (the library picker
added just before this decision, which stays as a second option).
The owner confirmed the app will deploy on **DigitalOcean**.

## Decision

- **DigitalOcean Spaces** (S3-compatible object storage) stores
  uploaded product photos. Chosen over Cloudinary/Vercel Blob/AWS S3
  specifically because the app deploys on DigitalOcean — same
  provider, no cross-vendor networking, and the standard AWS S3 SDK
  (`@aws-sdk/client-s3`) works against it unmodified.
- Objects are written with ACL `public-read` at upload time (the
  Space itself can stay "Restricted" for listing; only uploaded
  objects are individually public) under key prefix
  `products/<catSlug>/<timestamp>-<sanitised-original-filename>`.
- Config lives in `web/.env.local` (never committed): `DO_SPACES_KEY`,
  `DO_SPACES_SECRET`, `DO_SPACES_REGION`, `DO_SPACES_BUCKET`,
  `DO_SPACES_ENDPOINT` (e.g. `https://nyc3.digitaloceanspaces.com`),
  optional `DO_SPACES_CDN_ENDPOINT` if the owner enables the Spaces
  CDN (serves faster, same object, different hostname).
- `products.img` can now hold **either** shape: an `/img/...`
  approved-library path (existing, unchanged) **or** a full
  `https://` URL whose host matches the configured Spaces/CDN
  endpoint. Server-side validation (`assertImgPath` in
  `server/admin.ts`) accepts only these two shapes — still never an
  arbitrary external URL.
- Upload route (`POST /api/admin/upload-image`, admin-gated) accepts
  one image file (`image/jpeg|png|webp`, capped at 5 MB), uploads it,
  and returns the resulting URL for the form to set as `img`.

## Consequences

- Real uploaded photos are **not reviewed before going live** — unlike
  the "approved programme" library path, this is admin-trusted input
  at the moment of product creation. The no-placeholder-imagery policy
  (`docs/ASSET-INVENTORY.md`) now relies on admin judgment at upload
  time rather than a separate approval step; revisit if that's not
  acceptable.
- Credentials are dev-only secrets in `.env.local` today; production
  deployment needs the same four/five values set as real environment
  variables on the DigitalOcean host — not committed, not hardcoded.
- Deleting a product does **not** delete its uploaded object from
  Spaces (no cleanup job exists) — orphaned files accumulate; revisit
  if storage cost/hygiene becomes a concern.
- This does not change ADR-0005's stance for registration documents,
  quotation attachments, or delivery proofs — those remain
  metadata-only until a separate decision extends real storage to them.

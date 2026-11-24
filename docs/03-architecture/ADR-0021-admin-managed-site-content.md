# ADR-0021 — Admin-managed website content (hero + category banners)

> Status: Accepted (owner-directed) · Date: 2026-11-24

## Context

The homepage hero carousel, each catalogue category's banner image,
and each category's intro description were all hardcoded in source
(`hero-carousel.tsx`'s `SLIDES` array, `nav-catalogue.ts`'s
`CATEGORY_HERO` map, `catalog-copy.ts`'s `CATEGORY_INTRO` map). The
owner asked for an admin surface to add/change these images and copy
without a code change and redeploy.

## Decision

- One new table, `site_content`, discriminated by a `section` column
  (`'hero-slide' | 'category-hero' | 'category-intro'`) — chosen over
  three separate tables to keep the schema and admin UI surface small
  for what is fundamentally a short list of admin-editable rows.
  Hero slides carry sort order and an `active` flag (edited/disabled
  without deleting); category rows are keyed to a real `categories.slug`
  via `cat_slug`.
- New admin page **Website Content** (`/admin/content`, under the
  Catalogue nav group): add/edit/delete hero slides, set each
  category's hero image, set each category's intro text. Same
  `useAdminCall`/audit-logged mutation pattern as every other admin
  surface (PLT-003).
- Images are admin-trusted uploads to DigitalOcean Spaces (ADR-0013's
  pattern), under a new `site/<folder>/...` key prefix and a new,
  simpler `SiteImagePathField` control — no "browse library" step,
  since site/hero imagery (unlike product photography) has no
  pre-populated category folder to browse.
- New server-only reader module `server/content.ts` exposes
  `getHeroSlides()` / `getCategoryHeroMap()` / `getCategoryIntroMap()`
  (no-auth, public pages only) — kept separate from `server/admin.ts`,
  whose exports are all admin-gated.
- The homepage and catalog page now read from these functions; the
  original hardcoded `CATEGORY_HERO` / `CATEGORY_INTRO` maps remain in
  the codebase as a fallback when a given slug has no DB row (e.g. a
  future new category before an admin fills in its content) — not as
  the live source any more.
- The `site_content` table was seeded once, directly from the pre-existing
  hardcoded values (6 hero slides, 12 category hero images, 12 category
  intros), so publishing this feature caused no visible change until an
  admin actually edits something.

## Consequences

- Image uploads need `DO_SPACES_*` credentials configured, same
  pre-existing gap as every other upload surface in this app (product
  photos, service-request media).
- An admin can now take the homepage/catalogue imagery and copy out of
  sync with what a developer sees in the repo's static fallback
  constants — that's the intended behaviour, but it means "the hero
  slides" are no longer fully described by reading source alone; the
  `site_content` table is the live source of truth.
- No image moderation/approval step exists for these uploads, same
  trust model as ADR-0013.

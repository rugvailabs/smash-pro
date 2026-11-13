# ProSmash Asset Inventory

Guide to every asset directory: what belongs in it, accepted formats, naming
conventions, and whether its contents ship to production.

> **No placeholders.** Asset folders stay empty until real, approved assets are
> supplied. Never generate placeholder product images or logos.

## Directory Guide

| Directory | Purpose | Formats | Naming convention | Ships to prod? |
|---|---|---|---|---|
| `brand/logos/primary/` | Canonical ProSmash mark | SVG master; PNG @1x/2x exports | `prosmash-logo-{variant}-{color}.svg` | Yes |
| `brand/logos/variants/` | Mono / inverse / icon-only / favicon sources | SVG, ICO, PNG | same pattern | Yes |
| `brand/logos/usage/` | Clear-space / misuse reference sheets | PDF, PNG | free-form | No (internal) |
| `brand/fonts/` | Licensed typefaces only | WOFF2 preferred; TTF/OTF masters | `{family}-{weight}.woff2` + `LICENSES.md` | Yes |
| `brand/guidelines/` | Brand book, color tokens, voice & tone | PDF, MD | — | No (internal) |
| `assets/banners/homepage/` | Hero banners for the buyer-facing landing page | JPG/WebP, 2560px-wide masters | `home-hero-{slug}-{WxH}.jpg` | Yes |
| `assets/banners/promotional/` | Campaign, seasonal and institutional-offer banners | JPG/WebP | `promo-{campaign}-{slug}.jpg` | Yes |
| `assets/categories/` | One strong image per sport category | JPG/WebP, consistent aspect ratio | `cat-{sport-slug}.jpg` | Yes |
| `assets/products/<sport>/<product-slug>/` | Curated seed/demo product photography — all angles for one product together | JPG/WebP, white or consistent background | `{slug}-{angle}-{nn}.jpg` | Yes (seed data) |
| `assets/manufacturers/` | Manufacturer / brand partner logos | SVG preferred, PNG fallback | `mfg-{name-slug}.svg` | Yes |
| `assets/suppliers/` | Supplier profile & facility imagery | JPG/WebP | `sup-{name-slug}-{nn}.jpg` | Yes (seed data) |
| `assets/icons/` | UI icon system — single stroke width, 24px grid | SVG only | `ic-{name}.svg` | Yes |
| `assets/illustrations/` | Empty states, onboarding, 404/500 artwork | SVG preferred | `ill-{context}.svg` | Yes |
| `assets/references/` | Moodboards, competitor captures, inspiration | any | free-form | **Never** |
| `media/` | Application-managed runtime uploads (products, suppliers, documents) | defined by app | defined by app | Runtime only |

## Sport Category Slugs

Use exactly these slugs wherever a sport category appears in paths or filenames:

`cricket` · `football` · `basketball` · `volleyball` · `badminton` · `tennis` ·
`athletics` · `gym-fitness` · `indoor-games` · `outdoor-games` · `sportswear` · `accessories`

## Static vs Runtime Media

- `assets/` and `brand/` are **design-time**: curated by humans, version-controlled,
  referenced during UI build.
- `media/` is **runtime**: owned by the application (supplier uploads, document
  attachments). It is excluded from git, never hand-edited, and its internal
  structure is deferred until the technology stack and storage approach are chosen.
  The application must never write into `assets/` or `brand/`.

## Cross-Cutting Rules

1. All slugs are lowercase-kebab-case — no spaces, no underscores in filenames.
2. Every third-party asset (font, stock photo, reference) must carry a license note
   (a `LICENSES.md` in its directory).
3. Masters (SVG, full-resolution) live here; the build pipeline — once a stack
   exists — generates optimized variants. Never hand-edit compressed exports.
4. Nothing inside `assets/references/` may be imported by application code, ever.
5. Never overwrite an existing asset; add a new version alongside
   (`-v2` suffix) and retire the old one deliberately.

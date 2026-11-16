# ProSmash — Font Licensing Record

> Created 2026-11-17 as part of the Court Ink "Full Press" T1 foundation
> stage (font acquisition verification, per VISUAL-IDENTITY.md §3 and
> CLAUDE.md: "record licenses in brand/fonts/LICENSES.md at acquisition").

## Families in use

| Role | Family | Licence | Source |
|---|---|---|---|
| Display & headings (incl. Expanded widths via the `wdth` variable axis) | **Archivo** (variable) | SIL Open Font License 1.1 | Omnibus-Type · via Google Fonts |
| Body & UI | **Inter** (variable) | SIL Open Font License 1.1 | Rasmus Andersson · via Google Fonts |
| Reference IDs & code-like data | **IBM Plex Mono** (400/500) | SIL Open Font License 1.1 | IBM · via Google Fonts |

## Licence summary (SIL OFL 1.1 — all three families)

- Free to use, study, modify and redistribute, including commercial use and
  bundling with the ProSmash application.
- Fonts may be embedded/self-hosted with web applications without fee.
- The fonts may not be sold by themselves; reserved font names apply to
  modified versions (ProSmash ships unmodified fonts).
- Full licence text: https://openfontlicense.org (OFL-1.1).

## Delivery mechanism

Fonts are loaded through `next/font/google` (`web/src/app/layout.tsx`),
which downloads the font files **at build time** and serves them
**self-hosted from the application's own origin** (`/_next/static/media/…`).
No runtime requests are made to Google's servers, and no font bytes are
committed to this repository — the build artifact carries them. Archivo is
loaded with its `wdth` axis so Expanded display widths (112%) are available
per the visual identity.

If the delivery mechanism ever changes to repository-vendored font files,
place the files in this directory alongside their OFL.txt licence copies and
update this record.

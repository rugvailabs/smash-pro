# ProSmash — Shared Component Library

> Status: Proposed for owner review · Last updated: 2026-11-13
> Authority: VISUAL-IDENTITY.md (colour/type) · DESIGN-STANDARDS.md (tokens,
> accessibility, quality gates) · PORTAL-PRINCIPLES.md (per-surface rules).
> Visual reference: `preview/component-sheet.html` — the rendered sheet is the
> design intent; this file is the contract.
> Interim brand mark: bold "PROSMASH" text (no logo artwork).

**Design-reference distillation** (studied, not copied): Nike — typography
carries the brand before imagery does; Decathlon — category-first discovery
with honest product density; Stripe — restraint, one accent, generous
measure; Shopify — operational components earn their place by doing work.

**Global rules** (apply to every component; not repeated below):
tokens only (no ad-hoc values) · WCAG 2.2 AA with focus = 2px `ember-deep`
outline/2px offset · status never colour-alone · money = ₹ + two decimals,
tabular figures, right-aligned in tables · reference IDs in IBM Plex Mono ·
radius ≤ `radius.md` (4px) · hairline structure instead of floating cards ·
one primary action per view.

---

## 1. Navigation

**Public header** — Ink (`#0D1B24`) band, 64px desktop / 56px mobile.
Left: PROSMASH wordmark (Archivo 800, Chalk, +2% tracking). Centre: catalog
nav (Categories, How it works, For suppliers) — Inter 500 15px, Chalk at 80%
opacity, full opacity + 2px Ember underline (offset to the band's bottom
edge) when active. Right: search trigger, "Sign in" (text), "Register"
(primary button, Ember Deep). Mobile: wordmark + search + menu button opening
a full-height Ink drawer — 52px rows, Archivo 600 18px, active item carries
the 3px Ember bar, sign-in + the Register primary at the foot; focus-trapped,
closes on Esc.

**Portal header** — Chalk band, 56px, hairline bottom border. Left: PROSMASH
wordmark (Ink, Archivo 700, 18px) + portal label in Plex Mono 11px uppercase
`neutral.600` ("BUYER" / "SUPPLIER" / "ADMIN"). Right: notification bell with
count badge (Ember Deep, 10px numeral), org/user menu. Admin adds a slim
queue-summary strip under the header (see §18) rather than decorating the
header itself.

**Portal side navigation** (supplier/admin desktop) — 232px, Paper, hairline
right border. Items: Inter 500 14px `neutral.800`, 40px height, 12px left
inset; active = Ink text + 3px Ember left bar + `neutral.100` fill. Groups
titled in Plex Mono 11px uppercase `neutral.400`. Collapses to icon rail at
`lg`, bottom tab bar is **not** used — portals below `md` use the drawer.

**Accessibility:** nav landmarks labelled; current page `aria-current`;
drawer traps focus. **Misuse:** never place Ember on more than the active
item; never mix public and portal header anatomy.

## 2. Buttons

Anatomy: Inter 600 14px (15px on public site), `radius.sm`, horizontal
padding `space.4`; heights 44px (comfortable) / 40px (dense) / 32px compact
(admin table rows only).

| Variant | Fill / border | Text | Use |
|---|---|---|---|
| Primary | Ember Deep `#B23312` | Chalk | The one advancing action per view |
| Secondary | Chalk + `border.strong` | Ink | Alternative actions |
| Tertiary | none | Ink, underline on hover | Low-emphasis, inline |
| Destructive | `semantic.danger` | Chalk | Irreversible negatives; always paired with confirmation (§13) |
| Disabled | `neutral.100` | `neutral.400` | Any variant; no hover, `aria-disabled` |

States: hover darkens fill one step (Ember Deep → `#9A2C0F`); active
compresses nothing (no transform gimmicks) — fill darkens again; loading
replaces label with inline spinner + visually-hidden "Working…".
**Misuse:** two primaries in one view; Smash Ember `#E8481F` as a button fill
with small white text (fails AA — Ember Deep exists for this).

## 3. Search & Autocomplete

Input 44px (40px dense), Chalk, `border.strong`, search glyph left, Plex-Mono
shortcut hint right (desktop). Autocomplete panel: Chalk, `shadow.raised`,
hairline-separated groups — **Products** (name + brand + mono SKU),
**Categories**, **Reference IDs** (portal only: order/PO/requirement IDs in
mono). Matched substring in Inter 600 (no highlight colour). Keyboard:
arrows/Enter/Esc, `aria-expanded`/`listbox` semantics; min 2 chars.
Portal variation: admin search includes entity filters (orders, suppliers,
buyers); public search is products + categories only.
**Misuse:** no prices in public suggestions (OBD-03 keeps panels lean and
prices on pages); no fuzzy "AI suggestions" theatre.

## 4. Product Card

Structure (top→bottom): **full-bleed image area 4:3** to the card edges
(Chalk ground; until real photography: labelled placeholder frame —
`neutral.100` with 16° hatch and Plex Mono caption; never a fake photo) ·
padded body (`space.4`): category eyebrow (Plex Mono 11px uppercase
`neutral.600`) · product name (Inter 600 16px, Ink, max 2 lines) · brand +
key spec (Inter 400 13px `neutral.600`) · price block (§6) pinned to the
card base by a flexible body, so **prices baseline-align across a row**
regardless of name length.
Card: Chalk, hairline border, `radius.sm`; hover = border → `neutral.400` +
name underline; whole card is one link.
Grid: 4-up ≥`xl`, 3-up `lg`, 2-up `md`–`sm`, 1-up (horizontal: image left
96px, content right) below `sm`.
**Misuse:** no wishlist hearts, star ratings, "SALE" flashes or strikethrough
theatre — wholesale, not retail (PORTAL-PRINCIPLES §3).

## 5. Category Navigation

**Public category strip:** the 12 sports as flat tiles — Ink text on Paper,
hairline separators, Archivo 600 15px, count in Plex Mono 12px
`neutral.600`; hover underlines; active = Ember 2px bottom rule. Scrollable
row on mobile (edge-faded, momentum scroll).
**Portal category filter:** compact select or chip-set (§10), not the
expressive strip.
**Misuse:** no icon-in-circle tiles, no photographic category tiles until
real imagery exists (`assets/categories/`).

## 6. Pricing Display (OBD-03 / OBD-05 / OBD-20)

Three session-states, one component:

1. **Anonymous:** "Standard price" label (Plex Mono 11px uppercase
   `neutral.600`) + amount (Archivo 700 18px card / 26px detail, Ink,
   tabular) + "incl. GST" suffix (Inter 12px `neutral.600`). Below, the
   conversion line: "Institutional pricing — **Register to view your
   price**" (tertiary link, Ember Deep).
2. **Registered, pending approval:** identical to anonymous + quiet notice
   "Your institutional pricing activates on approval" (13px `neutral.600`).
3. **Approved buyer:** "Your price" label in **Ember Deep** (the single
   visual marker of the approved state) + amount (Archivo 700, Ink) with
   standard price as quiet context beneath (Inter 13px `neutral.600`,
   "Standard ₹X,XXX.00" — **no strikethrough, no % badge**: whether the
   discount % is shown explicitly is `PENDING OBD-20`).

All amounts GST-inclusive (OBD-20). **Misuse:** discount %, savings flashes,
countdown urgency; exposing any discounted price pre-approval.

## 7. Product Detail Information

Two-column ≥`lg` (gallery 55% / info 45%), stacked below. Info column order:
breadcrumb (§12) · category eyebrow · name (Archivo 600 26px) · brand ·
price block (§6) · availability chip — **banded indicator provisional:
presentation is `PENDING P-06`** · quantity + primary action (approved
buyers; anonymous sees register CTA) · **specification table**: key–value
rows, hairline-separated, 40px, key Inter 500 13px `neutral.600` 35%, value
Inter 400 14px Ink · description (16px/1.5, 68ch measure).
Gallery: main image 4:3 + thumbnail rail (placeholders per §4 rule).
**Misuse:** tabs that hide specifications; supplier identity anywhere
(boundary §3.3).

## 8. Forms & Inputs

Label above (Inter 500 13px, Ink) + optional helper (12px `neutral.600`);
input 44px/40px, Chalk, `border.strong`, `radius.sm`, 16px text (prevents
mobile zoom); focus ring per global rule. Error: `semantic.danger` border +
message with icon below (never colour-only); validate on blur, re-validate
on input. Required = "(required)" in label, not an asterisk alone.
Specialised: **GSTIN/PAN/IFSC inputs** render entered value in Plex Mono
with format validation (verification rules `PENDING OBD-02 ◇`) ·
**document upload slot**: dashed `border.strong` drop area, listed files
with per-document status chip (Submitted/Verified/Rejected/Expired — chips
per §11; statuses from the OBD-02 proposal, flagged) · **multi-step
progress rail**: numbered steps, Plex Mono numerals, Ember Deep current,
`neutral.400` upcoming, check for done.
Layout: single column, 520px max measure; related pairs may share a row
≥`md`. **Misuse:** placeholder-as-label; multi-column question grids.

## 9. Tables & Data Grids

Chalk surface, no outer radius. **Toolbar** above the header row: table
title (Archivo 600 16px) + count/filter summary (Plex Mono 12px
`neutral.600`) + right-aligned tertiary actions (export etc.). Header row:
Plex Mono 11px uppercase `neutral.600`, 40px, hairline bottom
`border.strong`, sticky with `shadow.raised` on scroll. Body rows 48px (comfortable) / 36–40px (dense);
hairline separators; hover `neutral.100`; optional zebra in dense mode only.
Cells: text left; numbers/money right + tabular; IDs mono; status chips §11;
row action = chevron or kebab at end (32px compact buttons).
Density is declared per screen (DESIGN-STANDARDS §2) — never mixed.
Responsive: `lg`+ full table; `md` drop tertiary columns; below `md` rows
become stacked key-value cards (label column = Plex Mono 11px) — buyer
portal always gets the card treatment on phones; admin tables scroll within
their container instead (desktop-first commitment).
Sort: header click, arrow indicator, `aria-sort`. Selection: leading
checkbox column (admin bulk ops) with header select-all.
**Misuse:** horizontal page scroll; truncating money; wrapping IDs.

## 10. Filters & Sorting

Filter bar above tables/grids: segments — status select, category select,
date-range, amount-range, free-text (reference IDs) — 40px controls in a
single hairline-bounded row; overflow collapses into a "Filters" drawer
button with active-count badge (always drawer below `lg`).
Applied filters render as **removable tokens** (Chalk chip, hairline, ×
button ≥24px hit area) in a row beneath, with "Clear all" tertiary.
Sort: single select, right-aligned, "Sort: Newest" pattern.
**Accessibility:** drawer focus-trapped; tokens announced on add/remove.
**Misuse:** auto-applying filters while the user is still composing them;
burying status filters (status is the #1 operational filter everywhere).

## 11. Status Badges & Chips

One system platform-wide (PORTAL-PRINCIPLES §1): tint background + deep
foreground + label, Inter 500 12px, 24px height, `radius.sm`, optional 14px
leading icon. Colour by semantic family — mapping is fixed:

- **Success family** `#1E7A46` on `#E6F2EB`: Active, Approved, Paid,
  Payment Confirmed, Delivered, Awarded, Verified, In stock.
- **Warning family** `#9A6A0B` on `#F8F0DC`: Pending Approval, Awaiting
  Verification, Awaiting Proof, Low Stock, Nearing Timeout, Revision
  Requested.
- **Danger family** `#B3261E` on `#F9E7E5`: Rejected, Failed, Cancelled,
  Suspended, Withdrawn, Expired, Out of stock.
- **Info family** `#1F5F8B` on `#E5EFF6`: Placed, Submitted, Processing,
  Dispatched, Draft-under-review.
- **Neutral** `neutral.600` on `neutral.100`: Draft, Closed, Archived.

Exact status vocabularies finalize with the data model; families are fixed
now. **Misuse:** Ember as a status colour (ember = action, never state);
inventing per-portal variants of the same state.

## 12. Breadcrumbs & Pagination

**Breadcrumb:** Inter 13px, `neutral.600`, "/" separators, current page Ink
non-link; collapses middle levels to "…" below `md`; `nav aria-label`.
**Pagination:** page numbers (40px square hit areas, active = Ink fill +
Chalk numeral), prev/next chevrons, "1–25 of 312" summary in Plex Mono 12px
left of controls; admin tables may add page-size select. Below `md`: summary
+ prev/next only. **Misuse:** infinite scroll on operational tables (admin
needs stable positions); pagination on 5-row lists.

## 13. Modals & Confirmation Dialogs

Chalk panel, `radius.md`, `shadow.overlay`, scrim = Ink at 40%; width 480px
(forms 640px); title Archivo 600 21px; body 15px/1.5; footer right-aligned:
tertiary cancel + one decisive action. **Destructive confirmations** (reject,
suspend, cancel order) restate the object ("Reject application from Meerut
Sports Works?"), require the mandatory reason field inline (workflow A/H
rule), and use the destructive button. Focus trapped; Esc + scrim click
close non-destructive modals only; focus returns to the trigger.
Full-screen takeover below `sm`. **Misuse:** modals for content that
deserves a page; stacking modals; "Are you sure?" without stating
consequences.

## 14. Empty · Loading · Error · Success States

- **Empty:** line illustration slot (icon-style, stroke, one Ember accent —
  commissioned later per VISUAL-IDENTITY §5; labelled placeholder until
  then), one-sentence reason (Inter 15px Ink), one action. Never bare
  "No data".
- **Loading:** skeleton bars (`neutral.100`, subtle pulse ≤200ms ease) that
  match the true layout (table rows, card grid); spinners only inside
  buttons. Respect reduced-motion.
- **Error:** inline banner — `danger.tint` fill, 3px danger left bar, icon +
  message + retry action; field errors per §8; full-page error reserved for
  genuinely broken routes.
- **Success:** toast (Chalk, `shadow.raised`, success icon, 13px) bottom-left
  desktop / top mobile, auto-dismiss 5s with pause-on-hover + close button;
  `aria-live="polite"`. Durable confirmations (order placed) get a page
  section, not a toast.

## 15. Quotation & Supplier Offer Blocks

**Quotation summary block** (admin inbox + supplier "My Quotations"): Chalk,
hairline, `radius.sm`; header row — supplier name (admin) or requirement
title (supplier) in Inter 600 15px + version tag in Plex Mono 12px ("v3") +
status chip; body grid of labelled values — Unit price, Quantity, Lead time,
Validity, Payment terms — label Plex Mono 11px uppercase `neutral.600`,
value Inter 600 15px tabular; footer: attachment count + actions (admin:
Negotiate / Request revision; supplier: Revise / Withdraw — per SUP-007).
**Version timeline:** vertical rail, mono version numerals, change summary
per entry, current emphasized — revisions are never silently overwritten.
**Comparison matrix (G):** latest versions side by side — columns =
suppliers (name + version tag), rows = the shared field order (unit price,
quantity, lead time, validity, performance signals), values tabular;
best-in-row emphasis is **weight only** — no medals or ranking colours, the
admin judges. Action row: Select & issue PO (one primary) / Negotiate per
column. Horizontal scroll within its container beyond ~4 suppliers. Split
awards `PENDING OBD-07`. Shared field order between blocks and matrix is
mandatory so columns scan.
Quotation "terms" are **supplier-side payment terms** (what ProSmash pays the
supplier, Workflow N) — never conflate with the buyer-side 100% advance rule
(OBD-08). Performance figures are **display signals only**: the UI never
ranks, scores, or makes eligibility decisions automatically.
**Misuse:** showing any quotation data in buyer contexts; ranking visuals
("best offer" medals) — admin judges, the UI presents; presenting supplier
terms anywhere a buyer could mistake them for buyer payment options.

## 16. GST & Price Breakdown (OBD-20)

One reusable block, identical at checkout, order detail, invoice preview
(DESIGN-STANDARDS §6.5). Rows: Items subtotal (after discount, ex-GST) →
GST (amount; **rate labels per product HSN pending OBD-20/OBD-11 — never
hardcoded**) → Shipping (direct-ship lines; admin-set per OBD-19, payer
presentation `PENDING ◇`) → rule `border.strong` → **Total payable
(incl. GST)** in Archivo 700 18px. Labels Inter 14px `neutral.800`; amounts
right, tabular, two decimals. The discount applied before GST (OBD-20) is
structurally visible: subtotal is the discounted taxable value.
**Misuse:** reordering rows per surface; a total that isn't GST-inclusive.

## 17. Order Summary & Checkout Components

**Line item row:** thumb 56px (placeholder rule §4) · name + mono SKU ·
unit price × qty (tabular) · line total right. Hairline-separated; qty
editable in cart (stepper 32px buttons), read-only at review.
**Checkout rail** (right column ≥`lg`, sticky; stacked + bottom summary bar
below): delivery address card (saved addresses radio list + add-new),
GST breakdown block (§16), payment method selector — radio list: UPI /
Card / Net Banking / NEFT-RTGS / Cheque (OBD-21); offline methods disclose
inline: "Pay by bank transfer, then upload proof — dispatch after
verification." Advance-payment notice (info banner): "Orders dispatch after
100% payment is confirmed" (OBD-08) — stated as fact, not apology.
**Payment states:** awaiting-payment panel with retry (timeout values
`PENDING ◇ OBD-21` — copy references "payment window", no hardcoded hours);
proof-upload slot for offline methods (§8 uploader).
**Misuse:** promo-code fields (promotional discounts are admin-assigned —
OBD-20, no public codes decided); hiding the advance-payment rule until the
last step.

## 18. Dashboard Metrics & Operational Queues

**Stat tile:** Chalk, hairline, `radius.sm`, padding `space.4`; label Plex
Mono 11px uppercase `neutral.600` → figure Archivo 700 26px tabular Ink →
context line 12px (e.g. "3 overdue" in semantic colour where true). The
whole tile links to its filtered list (ADM-019 AC1). Tiles row: 4-up `xl`,
2-up `md`, stacked `sm`; **composed per portal need — never one grid
template cloned** (anti-template guardrail).
**Queue list item:** 56px row — identity (name + mono ID) · submitted-age
(13px, `neutral.600`; ages > SLA in warning colour) · status chip · chevron.
Detail opens the §13-patterned review pane with checklist + decision bar
(approve / request changes / reject+reason) fixed bottom-right — one
anatomy for all queues (applications, payment proofs, cost proposals,
complaints).
**Charts:** none in phase-1 components; when dashboards need them, follow
the dataviz guidance with brand tokens — no decorative sparklines.
**Misuse:** vanity metrics without links; red/green deltas on figures that
aren't comparisons.

---

## Portal Application Matrix

| Component | Public | Buyer | Supplier | Admin |
|---|---|---|---|---|
| Header | Ink expressive | Chalk portal | Chalk portal | Chalk portal + queue strip |
| Density | comfortable | comfortable | dense-leaning | dense |
| Product card | standard price + register CTA | + your-price state | — | editor context only |
| Pricing block | state 1 | states 2–3 | never | full (costs/margins admin-only) |
| Tables | — | card-collapse on mobile | dense, tablet-ready | dense, in-container scroll |
| Quotation blocks | — | — | own quotes | inbox + comparison |
| Queues | — | — | — | primary pattern |
| Checkout | — | full | — | order-detail reuse of §16/§17 |

## Unresolved Dependencies (flagged, not designed around)

| Ref | Affects |
|---|---|
| P-06 stock display | §7 availability chip is provisional |
| OBD-20 discount-% display | §6 buyer state shows no % until decided |
| OBD-20 GST rates/HSN | §16 GST row shows amounts, never invented rates |
| OBD-19 shipping payer/invoice presentation ◇ | §16 shipping row copy |
| OBD-21 timeout defaults ◇ | §17 payment-window copy |
| OBD-02 verification workflows ◇ | §8 document statuses follow the proposal, flagged |
| OBD-15 multi-user orgs | header account menu scope |
| Brand fonts unacquired | preview uses hosted fonts; production self-hosts licensed files (brand/fonts/LICENSES.md) |
| Real imagery absent | §4/§5/§7 use labelled placeholder frames only |

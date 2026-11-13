# ProSmash — Portal Design Principles

> Status: ✅ Approved by owner — 2026-11-13 (Admin Portal stays visually
> restrained and data-focused per §5) · Last updated: 2026-11-13
> One brand, four surfaces. This document defines how the identity flexes per
> surface without fragmenting. Screen inventory: UI-PREPARATION-PLAN.md.

## 1. The Consistency Model

**Invariant everywhere (the brand core):**
- Token vocabulary (colour, type, space, radius, shadow — DESIGN-STANDARDS.md)
- Typography families and scale; tabular money formatting
- Status chip system: one lifecycle vocabulary, one colour-word pairing
  across all portals (a "Dispatched" chip is pixel-identical for admin,
  supplier and buyer)
- Component anatomy: buttons, forms, tables, queues, GST-breakdown block
- Accessibility standards and focus behaviour
- Voice: confident, precise, sentence case

**Variable per surface (the expression dial):**
- Expressive intensity (imagery, display type, the 16° diagonal)
- Density mode (comfortable ↔ dense)
- Navigation structure and information architecture
- Scale ceiling of the type ramp

This is the "expressiveness decreases as density increases" rule from
BRAND-FOUNDATION.md §5, made operational:

```
Expression ███████████▓▓▓▓▓▓░░░░░░░   Public → Buyer → Supplier → Admin
Density    ░░░░░▓▓▓▓▓▓▓███████████
```

## 2. Public Website

**Job:** convert institutions and suppliers into registrants; make ProSmash
feel like the serious counterparty the committee can approve.

- Fullest brand expression: Ink hero surfaces, Archivo Expanded display type
  (up to 56px), photography with ink overlay, 16° section cuts.
- Proof over promise: verified-supplier counts, category breadth, the
  procurement process drawn plainly. No testimonial-carousel clichés.
- Two clear journeys above the fold: "Buy for your institution" / "Supply to
  ProSmash" — the registration funnels are the site's only conversions.
- The catalog is public with standard listed prices (confirmed — OBD-03);
  every public product page carries the conversion block: register/sign in to
  see your discounted price. Discounts, supplier and commercial data never
  appear publicly.
- Fully responsive, mobile-first; page weight discipline (images do the
  talking, so they must be optimized at build).

## 3. Business Buyer Portal

**Job:** professional commerce — find, order, pay, track with zero doubt.

- Comfortable density; Paper canvas, Chalk product surfaces; photography
  appears only as product imagery — the catalog is the hero.
- Price display per OBD-20/OBD-03: the buyer's GST-inclusive discounted price
  prominent, the GST-breakdown component at checkout. The public standard
  listed price may appear as quiet context (it is public anyway), but no
  retail strikethrough theatrics — whether the discount % is shown explicitly
  is pending OBD-20; this is wholesale, the number is the number.
- State clarity is the trust feature: order status, payment status
  (including "awaiting admin verification" for offline payments) and
  delivery-confirmation prompts always one glance away.
- Ember guides the single next action per screen (add, checkout, pay,
  confirm receipt).
- Fully responsive; browsing and approving happen on phones.

## 4. Supplier Portal

**Job:** a working tool — see requirements, quote fast, fulfil POs, get paid.

- Dense-leaning layouts, minimal decoration; brand carried by type, spacing
  and the chip system. The supplier's dashboard answers "what needs me now?"
- Deadlines and money are first-class: quotation deadlines, PO
  acknowledgement windows, outstanding balances — tabular, exact, dated.
- Version clarity: quotation revisions presented as an explicit timeline
  (never silently overwritten) — mirrors the audit-first platform character.
- Boundary discipline by design: nothing in any supplier view references
  buyers, other suppliers or competing quotes (roles doc §3); direct-ship POs
  show exactly the Minimum Delivery Information fields, nothing more.
- Responsive to tablet; the phone experience prioritizes notifications,
  quote status, PO acknowledgement and camera-based delivery-proof upload.

## 5. Super Admin Portal

**Job:** run the entire trade loop — approvals, procurement, inventory,
orders, money — with total recall.

- Dense mode throughout; the aesthetic is control: hairline-structured
  tables, sticky headers, exact numbers, audit metadata on everything.
- Queues are the home pattern (approvals, payment verifications, complaints,
  cost proposals) — same queue anatomy everywhere, so operators learn it once.
- Ember strictly rationed to the action that advances work; semantic colours
  carry state; decoration ≈ zero. The 16° diagonal appears nowhere except
  possibly the login screen.
- Side-by-side comparison surfaces (quotation comparison, proof-vs-
  confirmation review) are specialized layouts, not stretched tables —
  designed once, reused.
- Desktop-first; information density is a feature, not a bug — but density
  comes from layout discipline, never from shrinking type below the scale.

## 6. Anti-Template Guardrails (all surfaces)

Restating the doctrine as testable rules:

1. No gradient fills; the only overlay is the flat ink photographic scrim.
2. Radius never exceeds 4px; content is structured by hairlines and space,
   not floating rounded cards.
3. No neon; Smash Ember is the only high-energy hue and it is rationed.
4. No cartoon or 3D-render sports illustration anywhere.
5. Dashboards are composed per portal need — never one grid template
   cloned four times.
6. Type does the branding before imagery does; imagery only where it is
   genuinely excellent.
7. If a screen could be mistaken for a generic admin template with a logo
   swapped, it fails review.

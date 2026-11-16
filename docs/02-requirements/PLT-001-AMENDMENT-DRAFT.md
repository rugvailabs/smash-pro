# PLT-001 Amendment — APPROVED & APPLIED

**Status: ✅ APPROVED by Owner 2026-11-16 — applied the same day.**
The amended text in §2 below is now in force in `FUNCTIONAL-REQUIREMENTS.md`
(PLT-001). Consequential updates applied: `USER-ROLES-AND-PERMISSIONS.md`
§3 item 1 and `UI-PREPARATION-PLAN.md` §1. Recorded in the
`OPEN-BUSINESS-DECISIONS.md` resolution log. This file is retained as the
amendment record; §1 preserves the superseded text for history.

Prepared: 2026-11-16 · Trigger: owner-approved Unified Shopping Website
milestone (one website; public standard prices; role-unlocked features).

---

## 1. Why an amendment is needed

PLT-001 (Confirmed) currently reads:

> Each role shall access only its own portal; sessions, navigation and data are
> strictly isolated per the access boundaries in `USER-ROLES-AND-PERMISSIONS.md` §3.
> - **AC1:** A credential grants exactly one role's portal.
> - **AC2:** Cross-portal data leakage cases in §3 (items 2, 3, 4, 6) are testable and enforced.

Two supporting statements assume physically separate portals:

- `USER-ROLES-AND-PERMISSIONS.md` §3 item 1: "each role accesses only its own
  portal. **No shared screens.**"
- `UI-PREPARATION-PLAN.md` §1: "Portals are fully isolated (PLT-001): separate
  navigation, no shared session or cross-portal links."

The owner has since approved a **unified website**: buyers, suppliers and
visitors use one web application whose public catalogue surface (PLT-006) is
shared, with role-unlocked navigation and features. "No shared screens" can no
longer be read literally for the buyer/supplier/public surfaces. The
**intent** of PLT-001 — strict role-scoped access and data isolation — is
unchanged and must survive the amendment intact.

## 2. Amended text (approved — in force)

> ### PLT-001 — Authentication and role-scoped access _(Amended — unified website)_
> The platform presents one unified web application for the public catalogue,
> buyer workflows and supplier workflows, plus a **separate Super Admin
> application**. Within the unified application, every screen, navigation item
> and data element is scoped to the authenticated role per the access
> boundaries in `USER-ROLES-AND-PERMISSIONS.md` §3; the only screens shared
> across roles are the public catalogue surfaces (PLT-006), which expose only
> public data plus the viewer's own applicable price (OBD-03).
> - **AC1:** A credential grants exactly one role (single-role accounts;
>   multi-user/role structure remains open under OBD-15).
> - **AC2:** Buyer-only routes and data are inaccessible to suppliers,
>   visitors and pending accounts; supplier-only routes and data are
>   inaccessible to buyers, visitors and pending accounts. Enforcement is
>   **server-side**; client-side gating is presentation only.
> - **AC3:** Cross-role data leakage cases in §3 (items 2, 3, 4, 6) remain
>   testable and enforced exactly as written.
> - **AC4:** Super Admin remains a separate application surface with separate
>   authentication; no admin screen or data is served from the unified website.

## 3. What does NOT change

- Access boundaries §3 items **2–8** (suppliers never see buyers beyond
  Minimum Delivery Information; buyers never see suppliers/costs/margins;
  no competing quotations; pre-approval lockout; pricing separation;
  scoped messaging; internal inventory) — all unchanged, word for word.
- OBD-03/OBD-05/OBD-20 pricing visibility rules — unchanged.
- OBD-15 (single vs multiple users per organization) — still open.
- PLT-002 … PLT-006 — unchanged.

Consequential edits — **applied 2026-11-16**:
`FUNCTIONAL-REQUIREMENTS.md` PLT-001 text; `USER-ROLES-AND-PERMISSIONS.md`
§3 item 1 wording ("portal" → "role-scoped surface; shared screens limited to
the public catalogue"); `UI-PREPARATION-PLAN.md` §1 isolation phrasing.

## 4. How the unified Next.js application maintains isolation

Reference implementation in `web/` (Phase A+B). Enforcement is layered so no
confidential value depends on client behaviour:

| Layer | Mechanism | Phase A+B state |
|---|---|---|
| Data shape | `src/data/` + `src/lib/catalog.ts` (API boundary) expose **only public catalogue fields** — no supplier identity, cost, margin or discount % exists anywhere in the client bundle | In place |
| Role state | Single role per session (`visitor / pending / buyer / supplier`) via `Providers`; preview switcher stands in for real auth | In place (preview) |
| Route scoping | Buyer routes (`/dashboard`, `/orders`, …) and supplier routes (`/supplier/*`) rendered only for their role; others get no link and (post-auth) a server-side denial via middleware/route guards | Phase C/D + auth |
| Price scoping | `PriceBlock` renders the applicable price only for the approved-buyer role; standard price is the public default; **discount % never rendered** | In place |
| Server enforcement | Once a backend exists, `lib/catalog.ts` bodies become authenticated API calls; the server returns only role-permitted fields, so a tampered client can't reveal data it never receives | Deferred with backend (per ADR-0001) |

Key principle: in Phase A+B the sample dataset itself contains nothing
confidential, so even the preview cannot leak what the boundaries protect.

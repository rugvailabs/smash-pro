# ADR-0004 — Authentication: First-Party Credential Sessions

> Status: Accepted (owner-directed full build, 2026-11-17)

## Decision

Phase-1 authentication is **first-party**: email + password (bcrypt-hashed)
against the platform's own `users` table, with **database-backed sessions**
referenced by an HTTP-only, SameSite=Lax cookie. Role and organization are
resolved **server-side on every request** from the session — never from
client state.

## Rationale

- Self-contained: no external provider account, keys or network dependency;
  swappable later for a managed provider behind the same session interface
  if the owner selects one.
- The preview's client-side role switcher is replaced at integration point
  I1 by real sessions; demo continuity is preserved with seeded demo
  accounts (approved buyer, approved supplier, pending applicants).

## Rules

- OBD-15 (multi-user organizations) is open: the model is
  `users → organization` from day one, but exactly one user per
  organization until decided.
- Registration creates an organization in `pending` status; approval is an
  admin-side transition (ADM-001/002). OBD-02 verification workflow remains
  ◇ proposed — documents are stored and listed, review checklists are not
  built.
- Passwords: bcrypt cost 10; sessions expire after 7 days; logout destroys
  the session row.

# ADR-0006 — Payments: Offline Path First; Gateway Deferred (OBD-21)

> Status: Accepted (2026-11-17)

## Decision

Only the **fully decided offline payment path** is implemented:
NEFT/RTGS/cheque with proof-upload (metadata per ADR-0005) and **admin
verification** flipping the payment to confirmed (OBD-21 DECIDED
operations; OBD-08 100% advance). Online methods (UPI/card/net-banking)
remain **presentation-only** until the owner selects a gateway
(OBD-21 ◇); in the demo they resolve through the existing payment
demonstration flow, clearly labelled.

## Rules

- The order state machine encodes OBD-08: `awaiting_payment →
  payment_confirmed → processing → dispatched → delivered → confirmed`
  (+ `cancelled_unpaid`); dispatch is impossible before confirmation.
- Timeout values are configurable columns with **no defaults in copy**
  (OBD-21 ◇); nothing auto-cancels in phase 1.
- Refunds (OBD-24 workflows) record to the original method; processing
  stays admin-side.

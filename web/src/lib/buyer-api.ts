import type { BuyerRequest, Institution, Order } from "@/lib/types";
import {
  accountForSession, institutionForSession, listAddresses,
  orderForSession, ordersForSession, requestsForSession,
} from "@/server/buyer";

/* ---------- account-management DTOs (new types live here, not types.ts) ---------- */

/** A delivery address with its row id — needed for edit/delete/set-default. */
export interface BuyerAddress {
  id: number;
  label: string;
  detail: string;
  isDefault: boolean;
}

/** Editable institutional account fields. Sensitive fields (legalName,
 *  gstin) are shown but change only via re-review (DECIDED rule). */
export interface BuyerAccount {
  legalName: string;
  orgType: string;
  gstin: string;
  contactName: string;
  contactPhone: string;
  email: string;
}

/** Outcome of re-adding a past order's lines to the cart. */
export interface ReorderResult {
  added: number;
  skipped: { sku: string; reason: string }[];
}

/** API BOUNDARY — now backed by the real backend (integration point I3).
 *  Every function scopes to the session's organization server-side
 *  (PLT-001): without an approved buyer session these return empty — the
 *  UI's role gates handle presentation, the server handles isolation. */

export async function getOrders(): Promise<Order[]> {
  return ordersForSession();
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return orderForSession(id);
}

export async function getRequests(): Promise<BuyerRequest[]> {
  return requestsForSession();
}

export async function getInstitution(): Promise<Institution> {
  const inst = await institutionForSession();
  // Role-gated pages render the gate for non-buyers; this empty shape is
  // never shown (and contains nothing).
  return (
    inst ?? {
      name: "", city: "", legalName: "", orgType: "", gstin: "", contact: "",
      email: "", buyerCategory: "", addresses: [], documents: [],
    }
  );
}

/** Delivery addresses with ids — the account address manager reads this.
 *  (Checkout keeps reading getInstitution().addresses unchanged.) */
export async function getAddresses(): Promise<BuyerAddress[]> {
  return listAddresses();
}

export async function getBuyerAccount(): Promise<BuyerAccount> {
  const acct = await accountForSession();
  return (
    acct ?? {
      legalName: "", orgType: "", gstin: "", contactName: "", contactPhone: "", email: "",
    }
  );
}

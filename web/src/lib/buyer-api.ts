import type { BuyerRequest, Institution, Order } from "@/lib/types";
import {
  institutionForSession, orderForSession, ordersForSession, requestsForSession,
} from "@/server/buyer";

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

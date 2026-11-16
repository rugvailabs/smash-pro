import { INSTITUTION, ORDERS, REQUESTS } from "@/data/buyer";
import type { BuyerRequest, Institution, Order } from "@/lib/types";

/** API BOUNDARY — buyer commerce. Async signatures so components never
 *  assume local data; backend integration replaces these bodies only.
 *  The future server returns only role-permitted fields (PLT-001 AC2). */

export async function getOrders(): Promise<Order[]> {
  return ORDERS;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return ORDERS.find((o) => o.id === id);
}

export async function getRequests(): Promise<BuyerRequest[]> {
  return REQUESTS;
}

export async function getInstitution(): Promise<Institution> {
  return INSTITUTION;
}

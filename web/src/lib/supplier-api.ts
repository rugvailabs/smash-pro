import {
  COST_PROPOSALS, PAYMENT_RECORDS, POS, QUOTES, REQUIREMENTS, SUPPLIER, SUPPLY_ITEMS,
} from "@/data/supplier";
import type {
  CostProposal, SupplierPO, SupplierProfile, SupplierQuote, SupplierRequirement, SupplyItem,
} from "@/lib/types";

/** API BOUNDARY — supplier workspace. Async signatures so components never
 *  assume local data; backend integration replaces these bodies only.
 *  The future server returns only role-permitted fields (PLT-001 AC2):
 *  requirements matched to the supplier's approved categories, own
 *  quotations only, and Minimum Delivery Information on direct POs. */

export async function getSupplierProfile(): Promise<SupplierProfile> {
  return SUPPLIER;
}

export async function getRequirements(): Promise<SupplierRequirement[]> {
  return REQUIREMENTS;
}

export async function getRequirement(id: string): Promise<SupplierRequirement | undefined> {
  return REQUIREMENTS.find((r) => r.id === id);
}

export async function getQuotes(): Promise<SupplierQuote[]> {
  return QUOTES;
}

export async function getQuote(reqId: string): Promise<SupplierQuote | undefined> {
  return QUOTES.find((q) => q.reqId === reqId);
}

export async function getPOs(): Promise<SupplierPO[]> {
  return POS;
}

export async function getPO(id: string): Promise<SupplierPO | undefined> {
  return POS.find((p) => p.id === id);
}

export async function getSupplyItems(): Promise<SupplyItem[]> {
  return SUPPLY_ITEMS;
}

export async function getCostProposals(): Promise<CostProposal[]> {
  return COST_PROPOSALS;
}

export async function getPaymentRecords() {
  return PAYMENT_RECORDS;
}

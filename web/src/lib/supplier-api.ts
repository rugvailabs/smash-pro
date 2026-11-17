import type {
  CostProposal, SupplierPO, SupplierProfile, SupplierQuote, SupplierRequirement, SupplyItem,
} from "@/lib/types";
import {
  costProposalsForSession, paymentRecordsForSession, poForSession, posForSession,
  profileForSession, quoteForSession, quotesForSession, requirementForSession,
  requirementsForSession, supplyItemsForSession,
} from "@/server/supplier";

/** API BOUNDARY — now backed by the real backend (integration point I4).
 *  The server scopes every query to the session's supplier organization
 *  and matches requirements to approved categories only (PLT-001 AC2);
 *  competing quotations and buyer identities are structurally absent. */

export async function getSupplierProfile(): Promise<SupplierProfile> {
  const p = await profileForSession();
  return (
    p ?? {
      name: "", legalName: "", type: "", gstin: "", contact: "", email: "",
      worksAddress: "", categories: [], documents: [], directApproved: false, directEnabled: [],
    }
  );
}

export async function getRequirements(): Promise<SupplierRequirement[]> {
  return requirementsForSession();
}

export async function getRequirement(id: string): Promise<SupplierRequirement | undefined> {
  return requirementForSession(id);
}

export async function getQuotes(): Promise<SupplierQuote[]> {
  return quotesForSession();
}

export async function getQuote(reqId: string): Promise<SupplierQuote | undefined> {
  return quoteForSession(reqId);
}

export async function getPOs(): Promise<SupplierPO[]> {
  return posForSession();
}

export async function getPO(id: string): Promise<SupplierPO | undefined> {
  return poForSession(id);
}

export async function getSupplyItems(): Promise<SupplyItem[]> {
  return supplyItemsForSession();
}

export async function getCostProposals(): Promise<CostProposal[]> {
  return costProposalsForSession();
}

export async function getPaymentRecords() {
  return paymentRecordsForSession();
}

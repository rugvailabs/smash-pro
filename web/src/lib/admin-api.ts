import type {
  AdminAnalytics, AdminBrandRow, AdminComplaintRow, AdminCounts, AdminInvoiceDetail,
  AdminInvoiceRow, AdminOrderDetail, AdminOrderRow,
  AdminOrgFullRow, AdminOrgRow, AdminPaymentRow, AdminPoRow, AdminPriceRule,
  AdminProductRequestRow, AdminProductRow, AdminReport, AdminRequirementDetail,
  AdminRequirementRow, AdminServiceRequestRow, AuditLogPage, BuyerTypeDiscountRow, Reconciliation,
  SupplierPerformanceRow,
} from "@/lib/admin-types";
import {
  adminCountsForSession, brandsForAdmin, buyerTypeDiscountsForAdmin, complaintsForAdmin, getAnalytics,
  getAuditLog, getOrganizationsFull, getReconciliation, getSupplierPerformance,
  invoiceablePosForRequirement, invoiceForAdmin, invoicesForAdmin,
  orderForAdmin, ordersForAdmin, organizationForAdmin, organizationsForAdmin,
  paymentsForAdmin, posForAdmin, priceRulesForAdmin, productRequestsForAdmin,
  productsForAdmin, reportForAdmin, requirementForAdmin, requirementsForAdmin,
  serviceRequestsForAdmin,
} from "@/server/admin";

/** API BOUNDARY — Super Admin reads (B5), backed by server/admin.ts.
 *  Non-admin sessions get null/empty (never a throw): admin pages gate on
 *  getAdminCounts() === null, and no operational data serialises without an
 *  admin session (PLT-001, server-enforced). */

export async function getAdminCounts(): Promise<AdminCounts | null> {
  return adminCountsForSession();
}

export async function getOrganizationsAdmin(
  filter?: "pending" | "active" | "all"
): Promise<AdminOrgRow[]> {
  return organizationsForAdmin(filter);
}

export async function getOrganizationAdmin(id: number): Promise<AdminOrgRow | null> {
  return organizationForAdmin(id);
}

export async function getProductsAdmin(): Promise<AdminProductRow[]> {
  return productsForAdmin();
}

export async function getPriceRulesAdmin(): Promise<AdminPriceRule[]> {
  return priceRulesForAdmin();
}

export async function getBrandsAdmin(): Promise<AdminBrandRow[]> {
  return brandsForAdmin();
}

export async function getBuyerTypeDiscounts(): Promise<BuyerTypeDiscountRow[]> {
  return buyerTypeDiscountsForAdmin();
}

export async function getOrdersAdmin(): Promise<AdminOrderRow[]> {
  return ordersForAdmin();
}

export async function getOrderAdmin(id: string): Promise<AdminOrderDetail | null> {
  return orderForAdmin(id);
}

export async function getPaymentsAdmin(): Promise<AdminPaymentRow[]> {
  return paymentsForAdmin();
}

export async function getRequirementsAdmin(): Promise<AdminRequirementRow[]> {
  return requirementsForAdmin();
}

export async function getRequirementAdmin(id: string): Promise<AdminRequirementDetail | null> {
  return requirementForAdmin(id);
}

export async function getPosAdmin(): Promise<AdminPoRow[]> {
  return posForAdmin();
}

export async function getComplaintsAdmin(): Promise<AdminComplaintRow[]> {
  return complaintsForAdmin();
}

export async function getServiceRequestsAdmin(): Promise<AdminServiceRequestRow[]> {
  return serviceRequestsForAdmin();
}

export async function getProductRequestsAdmin(): Promise<AdminProductRequestRow[]> {
  return productRequestsForAdmin();
}

export async function getAdminReport(): Promise<AdminReport | null> {
  return reportForAdmin();
}

/* ---------- enhancements (B5+) ---------- */

export async function getAuditLogAdmin(filter?: {
  entity?: string; entityId?: string; limit?: number; offset?: number;
}): Promise<AuditLogPage> {
  return getAuditLog(filter);
}

export async function getOrganizationsFullAdmin(): Promise<AdminOrgFullRow[]> {
  return getOrganizationsFull();
}

export async function getSupplierPerformanceAdmin(): Promise<SupplierPerformanceRow[]> {
  return getSupplierPerformance();
}

export async function getReconciliationAdmin(): Promise<Reconciliation> {
  return getReconciliation();
}

export async function getAnalyticsAdmin(): Promise<AdminAnalytics | null> {
  return getAnalytics();
}

export async function getInvoicesAdmin(): Promise<AdminInvoiceRow[]> {
  return invoicesForAdmin();
}

export async function getInvoiceAdmin(id: string): Promise<AdminInvoiceDetail | null> {
  return invoiceForAdmin(id);
}

export async function getInvoiceablePos(reqId: string) {
  return invoiceablePosForRequirement(reqId);
}

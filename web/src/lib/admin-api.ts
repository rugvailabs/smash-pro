import type {
  AdminComplaintRow, AdminCounts, AdminOrderDetail, AdminOrderRow, AdminOrgRow,
  AdminPaymentRow, AdminPoRow, AdminPriceRule, AdminProductRequestRow, AdminProductRow,
  AdminReport, AdminRequirementDetail, AdminRequirementRow,
} from "@/lib/admin-types";
import {
  adminCountsForSession, complaintsForAdmin, orderForAdmin, ordersForAdmin,
  organizationForAdmin, organizationsForAdmin, paymentsForAdmin, posForAdmin,
  priceRulesForAdmin, productRequestsForAdmin, productsForAdmin, reportForAdmin,
  requirementForAdmin, requirementsForAdmin,
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

export async function getProductRequestsAdmin(): Promise<AdminProductRequestRow[]> {
  return productRequestsForAdmin();
}

export async function getAdminReport(): Promise<AdminReport | null> {
  return reportForAdmin();
}

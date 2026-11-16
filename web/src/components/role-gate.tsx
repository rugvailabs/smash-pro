"use client";

import { useRole } from "@/components/providers";
import type { Role } from "@/lib/types";

/** Renders children only for the listed preview roles — the React
 *  counterpart of the static prototype's body[data-role] CSS gating. */
export function RoleGate({ show, children }: { show: Role[]; children: React.ReactNode }) {
  const { role } = useRole();
  return show.includes(role) ? <>{children}</> : null;
}

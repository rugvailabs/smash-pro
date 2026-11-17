import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";

/* All /admin/* routes render inside the operations shell. Access is
   gated per page server-side: getAdminCounts() returns null for
   non-admin sessions and the page renders AdminGate instead of data. */

export const metadata: Metadata = {
  title: { default: "Operations", template: "%s · Smash Pro Operations" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

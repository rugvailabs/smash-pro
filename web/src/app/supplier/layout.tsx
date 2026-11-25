import type { Metadata } from "next";
import { SupplierShell } from "@/components/supplier-shell";

/* All /supplier/* routes render inside the role-gated workspace shell. */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return <SupplierShell>{children}</SupplierShell>;
}

import { SupplierShell } from "@/components/supplier-shell";

/* All /supplier/* routes render inside the role-gated workspace shell. */

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return <SupplierShell>{children}</SupplierShell>;
}

"use client";

import { useRole } from "@/components/providers";

/* Small role-aware copy fragments used inside server-rendered pages. */

export function CatalogSubtitle() {
  const { role } = useRole();
  const copy: Record<string, string> = {
    visitor: "Standard listed prices, GST-inclusive.",
    pending: "Standard listed prices, GST-inclusive — your pricing activates on approval.",
    buyer: "Your institutional prices are shown — GST-inclusive.",
    supplier: "Public catalogue at standard listed prices.",
  };
  return <p className="mt-0.5 text-sm text-n600">{copy[role]}</p>;
}

export function DetailConvertNote() {
  const { role } = useRole();
  if (role === "visitor") {
    return (
      <p className="mt-1.5 text-[13px] text-n800">
        Institutional pricing —{" "}
        <a href="#" className="font-medium text-ember-deep hover:underline">Register to view your price</a> or{" "}
        <a href="#" className="font-medium text-ember-deep hover:underline">sign in</a>.
      </p>
    );
  }
  return null;
}

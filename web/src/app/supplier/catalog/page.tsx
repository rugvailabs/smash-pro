import type { Metadata } from "next";
import { PageHead } from "@/components/buyer-ui";
import { SupplyCatalog } from "@/components/supply-catalog";
import { getCostProposals, getSupplyItems } from "@/lib/supplier-api";

/* My catalogue — supply items + cost-change proposals (SUP-004/012). */

export const metadata: Metadata = { title: "My catalogue" };

export default async function SupplierCatalogPage() {
  const [items, proposals] = await Promise.all([getSupplyItems(), getCostProposals()]);
  return (
    <main>
      <PageHead
        title="My catalogue"
        sub="What you can supply — visible to the ProSmash sourcing team only, never to buyers"
        actions={
          <span className="inline-flex h-11 cursor-not-allowed items-center rounded-[2px] bg-n200 px-4 text-sm font-semibold text-n400" aria-disabled>
            + Add item (prototype)
          </span>
        }
      />
      <SupplyCatalog items={items} proposals={proposals} />
    </main>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHead } from "@/components/buyer-ui";
import { SupplyCatalog } from "@/components/supply-catalog";
import { PanelSkeleton } from "@/components/skeletons";
import { getCatalogItems, getCostProposals } from "@/lib/supplier-api";

/* My catalogue — supply items + cost-change proposals (SUP-004/012). */

export const metadata: Metadata = { title: "My catalogue" };

export default function SupplierCatalogPage() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <SupplierCatalogContent />
    </Suspense>
  );
}

async function SupplierCatalogContent() {
  const [items, proposals] = await Promise.all([getCatalogItems(), getCostProposals()]);
  return (
    <main>
      <PageHead
        title="My catalogue"
        sub="What you can supply — visible to the Smash Pro sourcing team only, never to buyers"
      />
      <SupplyCatalog items={items} proposals={proposals} />
    </main>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireBuyer } from "@/components/require-buyer";
import { RequestsView } from "@/components/requests-view";
import { PageHead } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { getRequests } from "@/lib/buyer-api";

/* Product requests — BUY-007, live submission to sourcing review. */

export const metadata: Metadata = { title: "Product requests" };

export default function RequestsPage() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10"><PanelSkeleton /></main>}>
      <RequestsContent />
    </Suspense>
  );
}

async function RequestsContent() {
  const requests = await getRequests();
  return (
    <RequireBuyer>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10">
        <PageHead
          title="Product requests"
          sub="Not in the catalogue? Request it — our team reviews every request for sourcing."
        />
        <RequestsView requests={requests} />
      </main>
    </RequireBuyer>
  );
}

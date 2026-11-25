import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireBuyer } from "@/components/require-buyer";
import { RequestsView } from "@/components/requests-view";
import { PageHead } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { Container } from "@/components/container";
import { getRequests } from "@/lib/buyer-api";

/* Product requests — BUY-007, live submission to sourcing review. */

export const metadata: Metadata = { title: "Product requests", robots: { index: false, follow: false } };

export default function RequestsPage() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<Container as="main" className="pb-16 pt-7"><PanelSkeleton /></Container>}>
      <RequestsContent />
    </Suspense>
  );
}

async function RequestsContent() {
  const requests = await getRequests();
  return (
    <RequireBuyer>
      <Container as="main" className="pb-16 pt-7">
        <PageHead
          title="Product requests"
          sub="Not in the catalogue? Request it — our team reviews every request for sourcing."
        />
        <RequestsView requests={requests} />
      </Container>
    </RequireBuyer>
  );
}

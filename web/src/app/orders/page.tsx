import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireBuyer } from "@/components/require-buyer";
import { OrdersTable } from "@/components/orders-table";
import { PageHead } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { Container } from "@/components/container";
import { getOrders } from "@/lib/buyer-api";

/* Orders — every order, payment and delivery, on record. */

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<Container as="main" className="pb-16 pt-7"><PanelSkeleton /></Container>}>
      <OrdersContent />
    </Suspense>
  );
}

async function OrdersContent() {
  const orders = await getOrders();
  return (
    <RequireBuyer>
      <Container as="main" className="pb-16 pt-7">
        <PageHead title="Orders" sub="Every order, payment and delivery — on record." />
        <OrdersTable orders={orders} />
      </Container>
    </RequireBuyer>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireBuyer } from "@/components/require-buyer";
import { OrdersTable } from "@/components/orders-table";
import { PageHead } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { getOrders } from "@/lib/buyer-api";

/* Orders — every order, payment and delivery, on record. */

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10"><PanelSkeleton /></main>}>
      <OrdersContent />
    </Suspense>
  );
}

async function OrdersContent() {
  const orders = await getOrders();
  return (
    <RequireBuyer>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10">
        <PageHead title="Orders" sub="Every order, payment and delivery — on record." />
        <OrdersTable orders={orders} />
      </main>
    </RequireBuyer>
  );
}

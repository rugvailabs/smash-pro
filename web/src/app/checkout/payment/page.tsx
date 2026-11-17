import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireBuyer } from "@/components/require-buyer";
import { PaymentResult } from "@/components/payment-demo";
import { EmptyState } from "@/components/empty-state";
import { FlowRail, PageHead } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { getOrder } from "@/lib/buyer-api";

/* Payment result for a just-placed REAL order (?order=ORD-…) — states per
   OBD-21 (demo auto-confirm for online methods; proof + admin verification
   for offline). */

export const metadata: Metadata = { title: "Payment" };

export default function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10"><PanelSkeleton /></main>}>
      <PaymentContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PaymentContent({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId = "" } = await searchParams;
  const order = orderId ? await getOrder(orderId.toUpperCase()) : undefined;

  return (
    <RequireBuyer>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10">
        <PageHead
          title="Payment"
          sub={order ? `Payment status for ${order.id}.` : "Payment status."}
          crumb={<><Link href="/checkout" className="hover:underline">Checkout</Link> / <b className="text-ink">Payment</b></>}
        />
        <FlowRail steps={["Cart", "Checkout", "Payment"]} current={2} />
        {order ? (
          <PaymentResult order={order} />
        ) : (
          <EmptyState
            message="No order to show."
            hint="Place an order from checkout to see its payment status here."
            actionLabel="Go to checkout"
            actionHref="/checkout"
          />
        )}
      </main>
    </RequireBuyer>
  );
}

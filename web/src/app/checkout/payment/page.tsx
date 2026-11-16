import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireBuyer } from "@/components/require-buyer";
import { PaymentDemo } from "@/components/payment-demo";
import { PageHead } from "@/components/buyer-ui";

/* Payment demonstration — states per OBD-21 (auto-verify vs proof + admin
   verification vs failed/retry). Frontend demo only. */

export const metadata: Metadata = { title: "Payment" };

export default function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-[60vh]" />}>
      <PaymentContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PaymentContent({ searchParams }: { searchParams: Promise<{ method?: string }> }) {
  const { method = "upi" } = await searchParams;
  return (
    <RequireBuyer>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10">
        <PageHead
          title="Payment"
          sub="Demonstration of the confirmed, verification-pending and failed payment states."
          crumb={<><Link href="/checkout" className="hover:underline">Checkout</Link> / <b className="text-ink">Payment</b></>}
        />
        <PaymentDemo method={method} />
      </main>
    </RequireBuyer>
  );
}

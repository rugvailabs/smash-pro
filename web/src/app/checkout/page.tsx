import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireBuyer } from "@/components/require-buyer";
import { CheckoutView } from "@/components/checkout-view";
import { FlowRail, PageHead } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { getInstitution } from "@/lib/buyer-api";

/* Checkout — review delivery, taxes and payment, then pay 100% in advance. */

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10"><PanelSkeleton /></main>}>
      <CheckoutContent />
    </Suspense>
  );
}

async function CheckoutContent() {
  const inst = await getInstitution();
  return (
    <RequireBuyer>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10">
        <PageHead
          title="Checkout"
          sub="Review delivery, taxes and payment — then pay 100% in advance."
          crumb={<><Link href="/cart" className="hover:underline">Cart</Link> / <b className="text-ink">Checkout</b></>}
        />
        <FlowRail steps={["Cart", "Checkout", "Payment"]} current={1} />
        <CheckoutView addresses={inst.addresses} />
      </main>
    </RequireBuyer>
  );
}

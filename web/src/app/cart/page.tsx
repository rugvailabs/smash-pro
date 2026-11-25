import Link from "next/link";
import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { FlowRail } from "@/components/buyer-ui";
import { Container } from "@/components/container";

/* Cart — client cart lines over localStorage; checkout arrives in Phase C. */

export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };

export default function CartPage() {
  return (
    <Container as="main" className="pb-16 pt-6">
      <div className="mb-1 text-[13px] text-n600">
        <Link href="/" className="hover:underline">Home</Link> / <b className="text-ink">Cart</b>
      </div>
      <h1 className="mb-4 font-display text-2xl font-bold tracking-tight text-ink md:text-[30px]">Your order</h1>
      <FlowRail steps={["Cart", "Checkout", "Payment"]} current={0} />
      <CartView />
    </Container>
  );
}

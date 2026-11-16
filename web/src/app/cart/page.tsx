import Link from "next/link";
import { CartView } from "@/components/cart-view";

/* Cart — client cart lines over localStorage; checkout arrives in Phase C. */

export default function CartPage() {
  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 md:px-10">
      <div className="mb-1 text-[13px] text-n600">
        <Link href="/" className="hover:underline">Home</Link> / <b className="text-ink">Cart</b>
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[30px]">Your order</h1>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-n400">
        preview cart · sample data · checkout flow arrives in phase c
      </p>
      <CartView />
    </main>
  );
}

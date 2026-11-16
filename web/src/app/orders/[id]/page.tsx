import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RequireBuyer } from "@/components/require-buyer";
import { OrderDetail } from "@/components/order-detail";
import { Chip, PageHead } from "@/components/buyer-ui";
import { getOrder } from "@/lib/buyer-api";
import { PanelSkeleton } from "@/components/skeletons";

/* Order detail — progress, lines, delivery, payment, documents. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${decodeURIComponent(id).toUpperCase()}` };
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10"><PanelSkeleton /></main>}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(decodeURIComponent(id).toUpperCase());
  if (!order) notFound();
  const paid = order.payment.status === "confirmed";

  return (
    <RequireBuyer>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10">
        <PageHead
          crumb={<><Link href="/orders" className="hover:underline">Orders</Link> / <b className="text-ink">{order.id}</b></>}
          title={<span className="font-mono text-[22px] tracking-normal">{order.id}</span>}
          sub={
            <span className="inline-flex flex-wrap items-center gap-2">
              Placed {order.placed} · {order.lines.length} {order.lines.length === 1 ? "line" : "lines"}
              {order.direct && <> · direct shipment</>}
              <Chip tone={paid ? "ok" : order.payment.status === "awaiting-verification" ? "warn" : "bad"}>
                {order.payment.statusLabel}
              </Chip>
            </span>
          }
        />
        <OrderDetail order={order} />
      </main>
    </RequireBuyer>
  );
}

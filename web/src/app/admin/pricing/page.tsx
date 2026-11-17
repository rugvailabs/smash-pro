import { Suspense } from "react";
import type { Metadata } from "next";
import { Banner, NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead } from "@/components/admin-ui";
import { BuyerDiscountTable } from "@/components/admin-buyer-discount";
import { getAdminCounts, getBuyerTypeDiscounts } from "@/lib/admin-api";

/* ADM pricing (OBD-05 revised) — Buyer Category Discounts. One rate per
   buyer organisation type, applied uniformly to EVERY product in all 12
   categories for every approved buyer of that type. Discount is off the
   public standard listed price and applies before GST presentation. The
   buyer's organisation type comes from the verified organisation record,
   never from client-submitted data; the rate is computed server-side and
   serialised only for approved buyers (one buyer never sees another's). */

export const metadata: Metadata = { title: "Pricing" };

export default function AdminPricingPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminPricingContent />
    </Suspense>
  );
}

async function AdminPricingContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const rows = await getBuyerTypeDiscounts();
  const activeCount = rows.filter((r) => r.configured && r.active).length;

  return (
    <main>
      <AdminHead
        title="Pricing"
        sub={
          <>
            <span className="num">{activeCount}</span> of{" "}
            <span className="num">{rows.length}</span> buyer categories with an active
            discount — off the public standard listed price
          </>
        }
      />

      <Banner tone="info" className="mb-6">
        <b className="text-ink">Buyer-category pricing (OBD-05).</b> Each
        approved buyer receives the single rate set for{" "}
        <b className="text-ink">their organisation type</b>, applied uniformly
        to <b className="text-ink">every product in all categories</b>. There
        are no product-level or per-organisation rules. Discounts apply{" "}
        <b className="text-ink">before</b> GST presentation; GST rates per HSN
        remain pending tax confirmation.
      </Banner>

      <Sect>Buyer Category Discounts — All Products</Sect>
      <BuyerDiscountTable rows={rows} />

      <NoteFlag className="mt-3">
        organisation type is read from the verified buyer record (not
        client-submitted) · only approved buyers receive a discount — pending
        buyers and public visitors always see the standard listed price ·
        removing a rate reverts that buyer type to the standard price
        immediately · changes are recorded (plt-003)
      </NoteFlag>
    </main>
  );
}

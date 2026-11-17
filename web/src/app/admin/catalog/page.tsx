import { Suspense } from "react";
import type { Metadata } from "next";
import { NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, ADMIN_CATEGORIES } from "@/components/admin-ui";
import { BulkCatalog, CategoryDiscountForm } from "@/components/admin-bulk-catalog";
import { ProductForm } from "@/components/admin-product-form";
import { getAdminCounts, getProductsAdmin } from "@/lib/admin-api";

/* ADM catalogue — the master product list. Standard listed price is
   public (OBD-03) and editable inline; active controls catalogue
   visibility; photography state is tracked but imagery arrives only via
   the approved programme (no placeholder images, ever). */

export const metadata: Metadata = { title: "Products" };

export default function AdminCatalogPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminCatalogContent />
    </Suspense>
  );
}

async function AdminCatalogContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const products = await getProductsAdmin();
  const active = products.filter((p) => p.active).length;
  const noPhoto = products.filter((p) => !p.hasImg).length;

  return (
    <main>
      <AdminHead
        title="Products"
        sub={
          <>
            <span className="num">{products.length}</span> products ·{" "}
            <span className="num">{active}</span> active ·{" "}
            <span className="num">{noPhoto}</span> awaiting photography
          </>
        }
      />

      <BulkCatalog products={products} />
      <NoteFlag className="mt-2.5">
        standard listed prices are public (obd-03) — buyer discounts apply on
        top via price rules · deactivating hides the product from the
        catalogue without deleting its record · bulk and single-item controls
        are both recorded (plt-003)
      </NoteFlag>

      <Sect>Category default discount</Sect>
      <CategoryDiscountForm categories={ADMIN_CATEGORIES} />

      <div className="mt-8 grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
        <div className="min-w-0">
          <Sect>Add product</Sect>
          <ProductForm />
        </div>
        <div className="min-w-0">
          <Sect>Catalogue rules</Sect>
          <div className="rounded-[2px] border border-n200 bg-chalk p-4 text-sm text-n800">
            <ul className="list-disc space-y-1.5 pl-4">
              <li>SKU format <span className="font-mono text-[12.5px]">XX-0000</span> — the two-letter prefix matches the category.</li>
              <li>Product photography is commissioned through the approved programme; no placeholder imagery is ever attached.</li>
              <li>GST rate and HSN classification per product are pending OBD-20 / OBD-11 and professional tax validation — the fields are deliberately absent.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

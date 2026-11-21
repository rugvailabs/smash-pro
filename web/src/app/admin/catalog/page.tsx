import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead } from "@/components/admin-ui";
import { BulkCatalog } from "@/components/admin-bulk-catalog";
import { AddProductButton } from "@/components/admin-product-modal";
import { ImportProductsButton } from "@/components/admin-product-import";
import { getAdminCounts, getBrandsAdmin, getProductsAdmin } from "@/lib/admin-api";

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
  const brands = await getBrandsAdmin();
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
        actions={
          <>
            <ImportProductsButton brands={brands} />
            <AddProductButton brands={brands} />
          </>
        }
      />

      <BulkCatalog products={products} brands={brands} />
      <NoteFlag className="mt-2.5">
        standard listed prices are public (obd-03) — approved-buyer discounts
        are set per buyer organisation type on the{" "}
        <Link href="/admin/pricing" className="font-semibold text-ember-deep hover:underline">Pricing</Link>{" "}
        page and apply to all products · deactivating hides the product from
        the catalogue without deleting its record · bulk and single-item
        controls are both recorded (plt-003)
      </NoteFlag>

      <Sect>Catalogue rules</Sect>
      <div className="max-w-[640px] rounded-[2px] border border-n200 bg-chalk p-4 text-sm text-n800">
        <ul className="list-disc space-y-1.5 pl-4">
          <li>SKU format <span className="font-mono text-[12.5px]">XX-0000</span> — the two-letter prefix matches the category.</li>
          <li>Product photography is commissioned through the approved programme; no placeholder imagery is ever attached.</li>
          <li>HSN code and GST % per product (ADR-0014) are optional, admin-entered record-keeping fields only — manually typed, not auto-assigned, and not yet wired into pricing, checkout or invoices, pending OBD-20 / OBD-11 professional tax validation.</li>
          <li>Importing a supplier stock sheet (ADR-0017) always previews before saving, auto-generates SKUs, and imports hidden (inactive) by default — review pricing and activate manually.</li>
        </ul>
      </div>
    </main>
  );
}

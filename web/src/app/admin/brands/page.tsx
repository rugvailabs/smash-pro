import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, tdCls, trCls } from "@/components/admin-ui";
import { BrandForm } from "@/components/admin-brand-form";
import { getAdminCounts, getBrandsAdmin } from "@/lib/admin-api";

/* ADM brand master list — the single place a brand name is ever typed.
   Products carry one brand (set in Add Product); purchase-order lines
   resolve brand automatically through their linked product. */

export const metadata: Metadata = { title: "Brands" };

export default function AdminBrandsPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminBrandsContent />
    </Suspense>
  );
}

async function AdminBrandsContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const brands = await getBrandsAdmin();

  return (
    <main>
      <AdminHead
        title="Brands"
        sub={<><span className="num">{brands.length}</span> brands on file</>}
      />

      <div className="grid items-start gap-7 lg:grid-cols-[5fr_7fr]">
        <div className="min-w-0">
          <Sect>Add brand</Sect>
          <BrandForm />
        </div>
        <div className="min-w-0">
          <Sect>Brand list</Sect>
          {brands.length === 0 ? (
            <EmptyState message="No brands yet." hint="Add the first brand to start assigning it to products." />
          ) : (
            <AdminTable cols={[{ h: "Brand" }, { h: "Notes" }, { h: "Products", right: true }]} minW={520}>
              {brands.map((b) => (
                <tr key={b.id} className={trCls}>
                  <td className={`${tdCls} font-semibold text-ink`}>{b.name}</td>
                  <td className={`${tdCls} text-n600`}>{b.notes ?? <span className="text-n400">—</span>}</td>
                  <td className={`${tdCls} num text-right`}>{b.productCount}</td>
                </tr>
              ))}
            </AdminTable>
          )}
        </div>
      </div>

      <NoteFlag className="mt-6">
        brand is set once per product on the{" "}
        <Link href="/admin/catalog" className="font-semibold text-ember-deep hover:underline">Products</Link>{" "}
        page (Add Product form) — purchase orders resolve it automatically
        from the linked product, nobody re-enters it per purchase
      </NoteFlag>
    </main>
  );
}

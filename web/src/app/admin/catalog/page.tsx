import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, catLabel, tdCls, trCls } from "@/components/admin-ui";
import { ActiveToggle, StdPriceCell } from "@/components/admin-catalog-controls";
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

      <AdminTable
        minW={960}
        maxH={620}
        cols={[
          { h: "SKU" }, { h: "Product" }, { h: "Category" }, { h: "Sub" },
          { h: "Std price", right: true }, { h: "Photography" }, { h: "Active" },
        ]}
      >
        {products.map((p) => (
          <tr key={p.sku} className={trCls}>
            <td className={`${tdCls} font-mono text-[12.5px] text-ink`}>{p.sku}</td>
            <td className={tdCls}>
              {p.name}
              {p.configurable && (
                <span className="ml-2 font-mono text-[9px] uppercase tracking-wide text-n400">config</span>
              )}
            </td>
            <td className={tdCls}>{catLabel(p.catSlug)}</td>
            <td className={tdCls}>{p.sub}</td>
            <td className={`${tdCls} whitespace-nowrap text-right`}>
              <StdPriceCell sku={p.sku} std={p.std} />
            </td>
            <td className={tdCls}>
              {p.hasImg
                ? <span className="font-mono text-[10px] uppercase tracking-wide text-n400">on file</span>
                : <Chip tone="warn">No photo</Chip>}
            </td>
            <td className={tdCls}><ActiveToggle sku={p.sku} active={p.active} /></td>
          </tr>
        ))}
      </AdminTable>
      <NoteFlag className="mt-2.5">
        standard listed prices are public (obd-03) — buyer discounts apply on
        top via price rules · deactivating hides the product from the
        catalogue without deleting its record
      </NoteFlag>

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

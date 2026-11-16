import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCategory, getFeatured, getProduct } from "@/lib/catalog";
import { AddToOrder, BuyerAvailability, PriceBlock, ProductGrid } from "@/components/product";
import { RacquetConfigurator } from "@/components/configurator";
import { DetailConvertNote } from "@/components/page-bits";

/* Product detail — gallery, role-aware pricing, specs; racquets route
   through the mandatory stringing/tension/grip configurator. */

export default function ProductPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  // params is awaited inside Suspense so the route shell can prerender
  return (
    <Suspense fallback={<main className="mx-auto max-w-[1280px] px-4 pt-6 md:px-10" />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const p = await getProduct(sku.toUpperCase());
  if (!p) notFound();
  const [category, featured] = await Promise.all([getCategory(p.cat), getFeatured()]);
  const related = featured.filter((f) => f.sku !== p.sku).slice(0, 4);

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 md:px-10">
      <div className="mb-4.5 text-[13px] text-n600">
        <Link href="/" className="hover:underline">Home</Link> /{" "}
        <Link href={`/catalog?cat=${p.cat}`} className="hover:underline">{category?.name ?? p.cat}</Link> /{" "}
        <b className="text-ink">{p.name}</b>
      </div>

      <div className="grid gap-9 lg:grid-cols-[6fr_5fr]">
        {/* gallery */}
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] border border-n200 bg-n100">
            <Image
              src={p.img}
              alt={`${p.name} — representative image`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover"
            />
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-n400">
            representative image · cc-licensed · replaced by approved product photography
          </p>
        </div>

        {/* info */}
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-n600">
            {category?.name ?? p.cat} · {p.sub} ·{" "}
            <span className="font-mono text-xs normal-case text-ink">SKU {p.sku}</span>
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-tight text-ink md:text-[30px]">
            {p.name}
          </h1>
          <div className="mb-4 mt-1 text-sm text-n600">{p.meta}</div>

          <div className="mb-4 border-y border-n200 py-4">
            <PriceBlock p={p} size="detail" />
            <DetailConvertNote />
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-n400">
              illustrative sample pricing — configured discounts pending (OBD-20)
            </p>
          </div>

          <BuyerAvailability />

          {p.configurable ? <RacquetConfigurator p={p} /> : <AddToOrder p={p} />}

          <div className="mb-2 mt-6 font-mono text-[11px] uppercase tracking-[.08em] text-n600">
            Specifications
          </div>
          <table className="w-full border-t border-n200 text-sm" aria-label="Key specifications">
            <tbody>
              {p.specs.map(([k, v]) => (
                <tr key={k} className="border-b border-n100">
                  <th className="w-[38%] py-2.5 pr-4 text-left align-top font-medium text-n600">{k}</th>
                  <td className="num py-2.5 text-ink">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {related.length > 0 && (
        <>
          <div className="mb-3 mt-12 flex items-center gap-3.5 font-mono text-[11px] uppercase tracking-[.08em] text-ember-deep after:h-px after:w-16 after:bg-n200">
            Often procured together
          </div>
          <ProductGrid items={related} />
        </>
      )}
    </main>
  );
}

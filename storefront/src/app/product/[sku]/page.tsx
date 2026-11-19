import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategory, getProduct, getRelatedProducts } from "@/lib/catalog";
import { AddToOrder, PriceBlock, ProductGrid, TrackView, WishlistToggleButton } from "@/components/product";
import { ProductGallery } from "@/components/product-gallery";
import { RacquetConfigurator } from "@/components/configurator";
import { DetailSkeleton } from "@/components/skeletons";

export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }): Promise<Metadata> {
  const { sku } = await params;
  const p = await getProduct(decodeURIComponent(sku).toUpperCase());
  if (!p) return { title: "Product not found" };
  return { title: p.name, description: `${p.sub} · ${p.meta} · SKU ${p.sku}` };
}

export default function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const p = await getProduct(sku.toUpperCase());
  if (!p) notFound();
  const [category, related] = await Promise.all([getCategory(p.cat), getRelatedProducts(p.sku)]);

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 md:px-10">
      <TrackView sku={p.sku} />
      <div className="mb-4.5 text-[13px] text-n600">
        <Link href="/" className="hover:underline">Home</Link> /{" "}
        <Link href={`/catalog/${p.cat}`} className="hover:underline">{category?.name ?? p.cat}</Link> /{" "}
        <b className="text-ink">{p.name}</b>
      </div>

      <div className="grid gap-9 lg:grid-cols-[6fr_5fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <ProductGallery name={p.name} images={p.gallery?.length ? [p.img, ...p.gallery] : [p.img]} />
        </div>

        <div>
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-n600">
            {category?.name ?? p.cat} · {p.sub} · <span className="font-mono text-xs normal-case text-ink">SKU {p.sku}</span>
          </span>
          <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-tight text-ink md:text-[30px]">{p.name}</h1>
          <div className="mb-4 mt-1 text-sm text-n600">{p.meta}</div>

          <div className="mb-4 border-y border-n200 py-4">
            <PriceBlock p={p} size="detail" />
          </div>

          <div className="mb-3.5 flex items-center gap-2">
            <span className="inline-flex h-6 items-center gap-1.5 rounded-[2px] bg-ok-t px-2 text-xs font-medium text-ok before:h-1.5 before:w-1.5 before:rounded-full before:bg-current">In stock</span>
          </div>

          {p.configurable ? <RacquetConfigurator p={p} /> : (
            <div className="flex flex-wrap items-center gap-3">
              <AddToOrder p={p} />
              <WishlistToggleButton sku={p.sku} name={p.name} />
            </div>
          )}

          <div className="mt-5 border-y border-n100 py-3 text-[13px] text-n600">
            <p><b className="font-medium text-ink">Fulfilled by Smash Pro</b> — one counterparty for order, delivery and resolution.</p>
          </div>

          <div className="mb-2 mt-6 font-mono text-[11px] uppercase tracking-[.08em] text-n600">Specifications</div>
          <table className="w-full border-t border-n200 text-sm" aria-label="Key specifications">
            <tbody>
              {p.specs.map(([k, v]) => (
                <tr key={k} className="border-b border-n100">
                  <th className="w-[35%] py-2.5 pr-4 text-left align-top font-medium text-n600">{k}</th>
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

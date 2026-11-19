import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCategories, getCategory, getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product";
import { CategoryHero } from "@/components/category-hero";
import { CatalogSidebar } from "@/components/catalog-sidebar";
import { CatalogToolbar } from "@/components/catalog-toolbar";
import { CategoryStrip } from "@/components/category-strip";
import { GridSkeleton } from "@/components/skeletons";
import { CATEGORY_HERO } from "@/lib/nav-catalogue";
import { PRICE_BANDS } from "@/lib/filter-defs";
import { CATEGORY_INTRO, defaultIntro, TYPE_FILTER_LABEL } from "@/lib/catalog-copy";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug);
  return { title: cat?.name ?? "Catalogue" };
}

export default function CategoryPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; price?: string; sort?: string; view?: string }>;
}) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <CategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryContent({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; price?: string; sort?: string; view?: string }>;
}) {
  const { slug: cat } = await params;
  const { type, price, sort, view } = await searchParams;
  const [categories, category, all] = await Promise.all([getCategories(), getCategory(cat), getProducts(cat)]);
  const title = category?.name ?? "Catalogue";
  const intro = category ? (CATEGORY_INTRO[cat] ?? defaultIntro) : defaultIntro;

  const types = [...new Set(all.map((p) => p.sub))];
  const band = price ? PRICE_BANDS[price] : undefined;
  let products = all.filter((p) => (!type || p.sub === type) && (!band || (p.std >= band.min && p.std <= band.max)));
  if (sort === "price-asc") products = [...products].sort((a, b) => a.std - b.std);
  else if (sort === "price-desc") products = [...products].sort((a, b) => b.std - a.std);
  else if (sort === "name") products = [...products].sort((a, b) => a.name.localeCompare(b.name));

  const total = category?.count ?? all.length;

  return (
    <main>
      <CategoryHero title={title} description={intro} hero={CATEGORY_HERO[cat] ?? null} count={total} />
      <CategoryStrip categories={categories} active={cat} />
      <div className="mx-auto max-w-[1280px] px-4 pb-16 md:px-10">
        <div className="grid gap-x-8 gap-y-4 pt-6 lg:grid-cols-[232px_1fr]">
          <Suspense fallback={<div className="h-10" />}>
            <CatalogSidebar types={types} typeLabel={TYPE_FILTER_LABEL[cat] ?? "Equipment"} />
          </Suspense>
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <p className="text-sm text-n600">
                {category ? (
                  <>Standard prices shown, GST-inclusive. <Link href="/register" className="font-semibold text-ember-deep hover:underline">Register to view your price →</Link></>
                ) : "Browse the catalogue."}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wide text-n400">fixture data · imagery representative</p>
            </div>
            <Suspense fallback={<div className="h-9" />}>
              <CatalogToolbar shown={products.length} total={total} />
            </Suspense>
            <div className="mt-5">
              {products.length ? (
                <ProductGrid items={products} priorityCount={4} view={view === "list" ? "list" : "grid"} />
              ) : all.length ? (
                <div className="border border-n200 bg-chalk p-12 text-center text-[15px] text-n600">
                  No <b className="text-ink">{title}</b> items match these filters.{" "}
                  <Link href={`/catalog/${cat}`} className="font-semibold text-ember-deep hover:underline">Clear filters</Link>
                </div>
              ) : (
                <div className="border border-n200 bg-chalk p-12 text-center text-[15px] text-n600">
                  Category not found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

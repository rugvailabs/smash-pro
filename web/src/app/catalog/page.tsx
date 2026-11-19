import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCategories, getCategory, getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product";
import { RoleGate } from "@/components/role-gate";
import { CatalogSubtitle } from "@/components/page-bits";
import { CategoryHero } from "@/components/category-hero";
import { CatalogSidebar } from "@/components/catalog-sidebar";
import { CatalogToolbar } from "@/components/catalog-toolbar";
import { PRICE_BANDS } from "@/lib/filter-defs";
import { CategoryStrip } from "@/components/category-strip";
import { GridSkeleton } from "@/components/skeletons";
import { CATEGORY_HERO } from "@/lib/nav-catalogue";
import { CATEGORY_INTRO, defaultIntro, TYPE_FILTER_LABEL } from "@/lib/catalog-copy";

/* Single-category listing — ONE shared component for all 12 categories:
   premium category hero (category imagery + description), the image-card
   category rail, a professional sidebar (price + equipment type), and the
   responsive product grid. Pricing stays role-resolved at the API boundary:
   approved buyers see their own applicable price/discount, visitors see the
   standard listed price. No pricing rules or records are changed here. */

export const metadata: Metadata = { title: "Catalogue" };

export default function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <CatalogContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CatalogContent({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; type?: string; price?: string; sort?: string; view?: string }>;
}) {
  const { cat = "cricket", type, price, sort, view } = await searchParams;
  const [categories, category, all] = await Promise.all([
    getCategories(),
    getCategory(cat),
    getProducts(cat),
  ]);
  const title = category?.name ?? "Catalogue";
  const intro = category ? (CATEGORY_INTRO[cat] ?? defaultIntro) : defaultIntro;

  // Presentation filtering/sorting over the API-boundary result. Price bands
  // filter the public standard listed price; applicable (buyer) prices are
  // presentation states of the same item, resolved server-side per role.
  const types = [...new Set(all.map((p) => p.sub))];
  const band = price ? PRICE_BANDS[price] : undefined;
  let products = all.filter(
    (p) => (!type || p.sub === type) && (!band || (p.std >= band.min && p.std <= band.max))
  );
  if (sort === "price-asc") products = [...products].sort((a, b) => a.std - b.std);
  else if (sort === "price-desc") products = [...products].sort((a, b) => b.std - a.std);
  else if (sort === "name") products = [...products].sort((a, b) => a.name.localeCompare(b.name));

  const total = category?.count ?? all.length;

  return (
    <main>
      <CategoryHero title={title} description={intro} hero={CATEGORY_HERO[cat] ?? null} count={total} />

      {/* image-led category rail (shared with search) */}
      <CategoryStrip categories={categories} active={cat} />

      <div className="mx-auto max-w-[1280px] px-4 pb-16 md:px-10">
        <div className="grid gap-x-8 gap-y-4 pt-6 lg:grid-cols-[232px_1fr]">
          {/* LEFT — professional sidebar filters */}
          <Suspense fallback={<div className="h-10" />}>
            <CatalogSidebar types={types} typeLabel={TYPE_FILTER_LABEL[cat] ?? "Equipment"} />
          </Suspense>

          {/* RIGHT — pricing context, toolbar, grid */}
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <CatalogSubtitle />
              <p className="font-mono text-[10px] uppercase tracking-wide text-n400">
                prices &amp; counts illustrative · imagery representative
              </p>
            </div>

            <Suspense fallback={<div className="h-9" />}>
              <CatalogToolbar shown={products.length} total={total} />
            </Suspense>

            <RoleGate show={["visitor"]}>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-l-[3px] border-ember-deep bg-chalk px-4 py-3 text-sm">
                <span>
                  <b className="text-ink">Standard prices shown, GST-inclusive.</b>{" "}
                  Registered institutions see their own price on approval.
                </span>
                <Link className="font-semibold text-ember-deep hover:underline" href="/register">
                  Register to view your price →
                </Link>
              </div>
            </RoleGate>

            <div className="mt-5">
              {products.length ? (
                <ProductGrid items={products} priorityCount={4} view={view === "list" ? "list" : "grid"} />
              ) : all.length ? (
                <div className="border border-n200 bg-chalk p-12 text-center text-[15px] text-n600">
                  No <b className="text-ink">{title}</b> items match these filters.{" "}
                  <Link href={`/catalog?cat=${cat}`} className="font-semibold text-ember-deep hover:underline">
                    Clear filters
                  </Link>
                </div>
              ) : (
                <div className="border border-n200 bg-chalk p-12 text-center text-[15px] text-n600">
                  Sample data for <b className="text-ink">{title}</b> hasn&rsquo;t been
                  added to this preview yet — browse Cricket or Badminton for the
                  populated examples.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

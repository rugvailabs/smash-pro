import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCategories, getCategory, getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product";
import { RoleGate } from "@/components/role-gate";
import { CatalogSubtitle } from "@/components/page-bits";
import { CatalogFilters } from "@/components/catalog-filters";
import { PRICE_BANDS } from "@/lib/filter-defs";
import { CategoryStrip } from "@/components/category-strip";
import { GridSkeleton } from "@/components/skeletons";

/* Catalogue — category strip, role-aware page head, filter toolbar, grid. */

// Static title: reading searchParams in generateMetadata would force the
// whole route dynamic; the category name is already visible in-page.
export const metadata: Metadata = { title: "Catalogue" };

export default function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  // searchParams is awaited inside Suspense so the route shell can prerender
  return (
    <Suspense fallback={<GridSkeleton />}>
      <CatalogContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CatalogContent({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; type?: string; price?: string; sort?: string }>;
}) {
  const { cat = "cricket", type, price, sort } = await searchParams;
  const [categories, category, all] = await Promise.all([
    getCategories(),
    getCategory(cat),
    getProducts(cat),
  ]);
  const title = category?.name ?? "Catalogue";

  // Presentation filtering/sorting over the API-boundary result; the future
  // backend takes these as query parameters. Price bands filter the public
  // standard price (role prices are presentation states of the same item).
  const types = [...new Set(all.map((p) => p.sub))];
  const band = price ? PRICE_BANDS[price] : undefined;
  let products = all.filter(
    (p) => (!type || p.sub === type) && (!band || (p.std >= band.min && p.std <= band.max))
  );
  if (sort === "price-asc") products = [...products].sort((a, b) => a.std - b.std);
  else if (sort === "price-desc") products = [...products].sort((a, b) => b.std - a.std);
  else if (sort === "name") products = [...products].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main>
      {/* category strip — shared §5 component with active rule + edge fade */}
      <CategoryStrip categories={categories} active={cat} />

      {/* page head */}
      <div className="border-b border-n200 bg-chalk">
        <div className="mx-auto max-w-[1280px] px-4 py-4.5 md:px-10 md:py-6">
          <div className="mb-1 text-[13px] text-n600">
            <Link href="/" className="hover:underline">Home</Link> /{" "}
            <Link href="/catalog?cat=cricket" className="hover:underline">Catalogue</Link> /{" "}
            <b className="text-ink">{title}</b>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[30px]">{title}</h1>
          <CatalogSubtitle />
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-n400">
            prices &amp; counts illustrative · imagery representative (cc-licensed)
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 pb-16 md:px-10">
        {/* toolbar — URL-driven filters (library §10) */}
        <div className="flex flex-wrap items-center gap-2.5 py-4">
          <Suspense fallback={<span className="h-9" />}>
            <CatalogFilters types={types} />
          </Suspense>
          <span className="num ml-auto font-mono text-xs text-n600">
            {products.length} of {category?.count ?? products.length} items shown · sample
          </span>
        </div>

        <RoleGate show={["visitor"]}>
          <div className="mb-4 flex flex-wrap items-center gap-3 border-l-[3px] border-ember-deep bg-chalk px-4 py-3 text-sm">
            <span>
              <b className="text-ink">Standard prices shown, GST-inclusive.</b>{" "}
              Registered institutions see their own price on approval.
            </span>
            <a className="font-semibold text-ember-deep hover:underline" href="#">
              Register to view your price →
            </a>
          </div>
        </RoleGate>

        {products.length ? (
          // First grid row is the LCP on this route — eager-load it only.
          <ProductGrid items={products} priorityCount={4} />
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
    </main>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCategories, searchProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product";
import { CategoryStrip } from "@/components/category-strip";
import { GridSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/empty-state";
import { Container } from "@/components/container";

/* Search results — server-rendered over the catalog API boundary. */

export const metadata: Metadata = { title: "Search" };

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // searchParams is awaited inside Suspense so the route shell can prerender
  return (
    <Suspense fallback={<GridSkeleton />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [results, categories] = await Promise.all([searchProducts(q), getCategories()]);

  return (
    <main>
      {/* same catalogue anatomy — search is a view of the catalogue,
          not a separate tool (no active category) */}
      <CategoryStrip categories={categories} />
      <div className="border-b border-n200 bg-chalk">
        <Container className="py-4.5 md:py-6">
          <div className="mb-1 text-[13px] text-n600">
            <Link href="/" className="hover:underline">Home</Link> / <b className="text-ink">Search</b>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[30px]">
            {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}
          </h1>
          <p className="num mt-0.5 text-sm text-n600">
            {q
              ? `${results.length} ${results.length === 1 ? "match" : "matches"}`
              : "Type a search above to look across the catalogue."}
          </p>
        </Container>
      </div>

      <Container className="py-6 pb-16">
        {results.length ? (
          // Results grid is above the fold here too — eager-load row one only.
          <ProductGrid items={results} priorityCount={4} />
        ) : (
          <EmptyState
            message={q ? <>No sample products match &ldquo;{q}&rdquo;.</> : "Nothing searched yet."}
            hint={<>Try &ldquo;bat&rdquo;, &ldquo;racquet&rdquo; or &ldquo;jersey&rdquo;.</>}
            actionLabel="Browse the catalogue"
            actionHref="/catalog?cat=cricket"
          />
        )}
      </Container>
    </main>
  );
}

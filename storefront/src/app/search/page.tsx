import { Suspense } from "react";
import { searchProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product";
import { GridSkeleton } from "@/components/skeletons";

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = await searchProducts(q);

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">
        {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}
      </h1>
      <p className="mt-2 text-[14px] text-n600">{results.length} product{results.length === 1 ? "" : "s"} found</p>
      <div className="mt-7">
        {results.length > 0 ? (
          <ProductGrid items={results} priorityCount={4} />
        ) : (
          <div className="flex flex-col items-center gap-2 border border-n200 bg-chalk py-16 text-center">
            <svg viewBox="0 0 24 24" aria-hidden className="h-10 w-10 fill-none stroke-n400" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
            <p className="mt-2 text-[15px] text-n600">No products match &ldquo;{q}&rdquo;.</p>
            <p className="text-[13px] text-n400">Try a different term, or browse by category.</p>
          </div>
        )}
      </div>
    </main>
  );
}

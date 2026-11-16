import Link from "next/link";
import { Suspense } from "react";
import { searchProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product";

/* Search results — server-rendered over the catalog API boundary. */

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // searchParams is awaited inside Suspense so the route shell can prerender
  return (
    <Suspense fallback={<main className="min-h-[60vh]" />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = await searchProducts(q);

  return (
    <main>
      <div className="border-b border-n200 bg-chalk">
        <div className="mx-auto max-w-[1280px] px-4 py-4.5 md:px-10 md:py-6">
          <div className="mb-1 text-[13px] text-n600">
            <Link href="/" className="hover:underline">Home</Link> / <b className="text-ink">Search</b>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[30px]">
            {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}
          </h1>
          <p className="num mt-0.5 text-sm text-n600">
            {q ? `${results.length} sample ${results.length === 1 ? "match" : "matches"}` : "Type a search above to look across the catalogue."}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-n400">
            search runs over preview sample data only
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-6 pb-16 md:px-10">
        {results.length ? (
          <ProductGrid items={results} />
        ) : (
          <div className="border border-n200 bg-chalk p-12 text-center">
            <p className="mb-1 text-[15px] text-ink">
              {q ? <>No sample products match &ldquo;{q}&rdquo;.</> : "Nothing searched yet."}
            </p>
            <p className="mb-4 text-sm text-n600">Try &ldquo;bat&rdquo;, &ldquo;racquet&rdquo; or &ldquo;jersey&rdquo;.</p>
            <Link href="/catalog?cat=cricket" className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white">
              Browse the catalogue
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

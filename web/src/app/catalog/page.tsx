import Link from "next/link";
import { Suspense } from "react";
import { getCategories, getCategory, getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product";
import { RoleGate } from "@/components/role-gate";
import { CatalogSubtitle } from "@/components/page-bits";

/* Catalogue — category strip, role-aware page head, filter toolbar, grid. */

export default function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  // searchParams is awaited inside Suspense so the route shell can prerender
  return (
    <Suspense fallback={<main className="min-h-[60vh]" />}>
      <CatalogContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CatalogContent({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat = "cricket" } = await searchParams;
  const [categories, category, products] = await Promise.all([
    getCategories(),
    getCategory(cat),
    getProducts(cat),
  ]);
  const title = category?.name ?? "Catalogue";

  return (
    <main>
      {/* category strip */}
      <nav aria-label="Sport categories" className="flex overflow-x-auto border-b border-n200 bg-paper">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/catalog?cat=${c.slug}`}
            className={
              "shrink-0 border-r border-n200 px-5 py-3.5 first:border-l " +
              (c.slug === cat ? "shadow-[inset_0_-2px_0_var(--color-ember)]" : "")
            }
          >
            <span className="block whitespace-nowrap font-display text-sm font-semibold text-ink">{c.name}</span>
            <span className="num font-mono text-[10px] text-n600">{c.count}</span>
          </Link>
        ))}
      </nav>

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
        {/* toolbar — static filter affordances (functional filtering arrives with the full catalogue) */}
        <div className="flex flex-wrap items-center gap-2.5 py-4">
          {["Type: All", "Price: Any", "Sort: Relevance"].map((f) => (
            <select key={f} aria-label={f.split(":")[0]} className="h-9 rounded-[2px] border border-n400 bg-chalk px-2.5 text-[13px] text-ink">
              <option>{f}</option>
            </select>
          ))}
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
          <ProductGrid items={products} />
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

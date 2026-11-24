import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategory, getProduct, getRelatedProducts } from "@/lib/catalog";
import { AddToOrder, BuyerAvailability, PriceBlock, ProductGrid } from "@/components/product";
import { ProductGallery } from "@/components/product-gallery";
import { RacquetConfigurator } from "@/components/configurator";
import { VariantPicker } from "@/components/variant-picker";
import { DetailConvertNote } from "@/components/page-bits";
import { DetailSkeleton } from "@/components/skeletons";
import { NoteFlag } from "@/components/buyer-ui";
import { SMASH_PRO_WHATSAPP_LINK } from "@/lib/company-profile";

/* Product detail — gallery, role-aware pricing, specs; racquets route
   through the mandatory stringing/tension/grip configurator. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sku: string }>;
}): Promise<Metadata> {
  const { sku } = await params;
  const p = await getProduct(decodeURIComponent(sku).toUpperCase());
  if (!p) return { title: "Product not found" };
  return { title: p.name, description: `${p.sub} · ${p.meta} · SKU ${p.sku}` };
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  // params is awaited inside Suspense so the route shell can prerender
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
  // Cross-sell stays within the product's own category (procurement-relevant);
  // the section is omitted entirely when the category has no other items.
  const [category, related] = await Promise.all([getCategory(p.cat), getRelatedProducts(p.sku)]);

  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 md:px-10">
      <div className="mb-4.5 text-[13px] text-n600">
        <Link href="/" className="hover:underline">Home</Link> /{" "}
        <Link href={`/catalog?cat=${p.cat}`} className="hover:underline">{category?.name ?? p.cat}</Link> /{" "}
        <b className="text-ink">{p.name}</b>
      </div>

      <div className="grid gap-9 lg:grid-cols-[6fr_5fr]">
        {/* gallery — thumbnail rail appears when Set A frames arrive.
            Sticky on desktop so the image keeps the tall info column company. */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <ProductGallery name={p.name} images={p.gallery?.length ? [p.img, ...p.gallery] : [p.img]} />
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
            {/* ADR-0016: a grouped listing's price depends on which Size/
                Colour the buyer picks below — VariantPicker owns that
                PriceBlock instead, so it isn't shown twice. */}
            {!(p.variants && p.variants.length > 1) && <PriceBlock p={p} size="detail" />}
            <DetailConvertNote />
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-n400">
              illustrative sample pricing — configured discounts pending (OBD-20)
            </p>
          </div>

          <BuyerAvailability />

          {p.configurable ? (
            <RacquetConfigurator p={p} />
          ) : p.variants && p.variants.length > 1 ? (
            <VariantPicker initialSku={p.sku} variants={p.variants} />
          ) : (
            <AddToOrder p={p} />
          )}

          {/* certainty block — confirmed rules only (managed fulfilment,
              OBD-08 advance payment); no dates or SLAs are promised */}
          <div className="mt-5 border-y border-n100 py-3 text-[13px] text-n600">
            <p><b className="font-medium text-ink">Fulfilled by Smash Pro</b> — one counterparty for order, delivery and resolution.</p>
            <p className="mt-1">Dispatch follows confirmed payment — 100% advance, no credit facilities.</p>
            <NoteFlag className="mt-1.5">delivery timelines pending fulfilment confirmation (obd-19 ◇)</NoteFlag>
          </div>

          <div className="mb-2 mt-6 font-mono text-[11px] uppercase tracking-[.08em] text-n600">
            Specifications
          </div>
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

          {/* assistance at the decision point — PRESENTATION ONLY. This is
              not an enquiry intake: no form, no lead storage, no admin queue
              (D12 boundary — pending business-requirements approval). It
              points at the existing WhatsApp affordance only. */}
          <div className="mt-6 rounded-[2px] border border-n200 bg-chalk p-4">
            <div className="font-mono text-[11px] uppercase tracking-[.08em] text-n600">Stuck on a question?</div>
            <div className="mt-1 text-sm font-semibold text-ink">Ask the Smash Pro sourcing team</div>
            <p className="mt-1 max-w-[52ch] text-[13px] text-n600">
              Specifications, quantities, alternatives or institutional
              requirements — talk to the team that sources this catalogue.
            </p>
            <a
              href={SMASH_PRO_WHATSAPP_LINK}
              target="_blank"
              rel="noopener"
              className="mt-3 inline-flex h-10 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink"
            >
              WhatsApp the sourcing team
            </a>
            <NoteFlag className="mt-2">
              assistance presentation only — enquiry intake pending business
              approval (d12)
            </NoteFlag>
          </div>
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

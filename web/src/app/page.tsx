import Image from "next/image";
import Link from "next/link";
import { getCategories, getFeatured } from "@/lib/catalog";
import { ProductGrid } from "@/components/product";
import { RoleGate } from "@/components/role-gate";

/* Home — hero, category grid, featured pricing, how-it-works, supplier band. */

function Kick({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3.5 font-mono text-[11px] uppercase tracking-[.08em] text-ember-deep after:h-px after:w-16 after:bg-n200">
      {children}
    </div>
  );
}

function SectionHead({ title, more, moreHref }: { title: string; more?: string; moreHref?: string }) {
  return (
    <div className="mb-7 flex flex-wrap items-baseline gap-5">
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[30px]">{title}</h2>
      {more && moreHref && (
        <Link href={moreHref} className="ml-auto text-sm font-semibold text-ember-deep hover:underline">
          {more}
        </Link>
      )}
    </div>
  );
}

const STEPS: [string, string][] = [
  ["Register and get approved", "Your institution's details are reviewed before ordering is enabled."],
  ["See your price", "Standard prices are public. On approval, your institutional price appears on every product."],
  ["Order with 100% advance", "UPI, card, net banking, NEFT/RTGS or cheque — dispatch after payment is confirmed."],
  ["One counterparty", "ProSmash manages fulfilment and stays your single point of contact for delivery."],
];

export default async function HomePage() {
  const [categories, featured] = await Promise.all([getCategories(), getFeatured()]);

  return (
    <main>
      {/* hero */}
      <section className="relative overflow-hidden bg-ink text-chalk">
        <Image
          src="/img/hero/home-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(13,27,36,.68)]" />
        <div className="relative mx-auto max-w-[1280px] px-4 py-14 md:px-10 md:pb-[92px] md:pt-[84px]">
          <span className="font-mono text-[11px] uppercase tracking-[.08em] text-white/55">
            India&rsquo;s B2B sports commerce platform
          </span>
          <h1
            className="my-4 max-w-[17ch] font-display text-[32px] font-bold leading-[1.08] tracking-[-.02em] text-chalk md:text-[52px] min-[1440px]:text-[60px]"
            style={{ fontStretch: "112%" }}
          >
            Procurement at <em className="not-italic text-ember">match standard.</em>
          </h1>
          <p className="max-w-[52ch] text-base leading-relaxed text-white/80 md:text-lg">
            One catalogue for schools, academies, colleges and retailers —
            standard prices in the open, institutional pricing on approval, and
            every order managed end to end by ProSmash.
          </p>
          <div className="mt-7 flex flex-wrap gap-3.5">
            <Link href="/catalog?cat=cricket" className="inline-flex h-12 items-center rounded-[2px] bg-ember-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-ember-press">
              Shop the catalogue
            </Link>
            <RoleGate show={["visitor", "pending"]}>
              <a href="#" className="inline-flex h-12 items-center rounded-[2px] border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:border-white">
                Register your institution
              </a>
            </RoleGate>
          </div>
        </div>
      </section>

      {/* categories */}
      <section className="border-y border-n200 bg-chalk py-11 md:py-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10">
          <Kick>Catalogue</Kick>
          <SectionHead title="Every sport. One platform." more="Browse all →" moreHref="/catalog?cat=cricket" />
          <div className="grid grid-cols-2 border-l border-t border-n200 md:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/catalog?cat=${c.slug}`}
                className="flex min-h-[88px] flex-col justify-between border-b border-r border-n200 bg-chalk p-4 transition-colors hover:bg-paper md:min-h-[104px] md:p-[22px]"
              >
                <span className="font-display text-base font-bold text-ink md:text-[19px]">{c.name}</span>
                <span className="num font-mono text-xs text-n600">{c.count} products</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* featured */}
      <section className="py-11 md:py-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10">
          <Kick>Public pricing</Kick>
          <SectionHead title="Wholesale standards, in the open." more="All products →" moreHref="/catalog?cat=cricket" />
          <ProductGrid items={featured} />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-n400">
            prices &amp; discounts are illustrative sample data — configured
            percentages pending owner approval (OBD-20) · imagery is
            representative, CC-licensed (see credits)
          </p>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="scroll-mt-32 border-y border-n200 bg-chalk py-11 md:py-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10">
          <Kick>Process</Kick>
          <SectionHead title="How ProSmash works" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <div key={t}>
                <span className="font-mono text-[11px] uppercase tracking-[.08em] text-ember-deep">
                  STEP {String(i + 1).padStart(2, "0")}
                </span>
                <h4 className="mb-1.5 mt-2 font-display text-[17px] font-semibold text-ink">{t}</h4>
                <p className="text-sm text-n600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* supplier band */}
      <section id="supply" className="scroll-mt-32 py-11 md:py-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10">
          <Kick>For manufacturers · wholesalers · distributors · dealers</Kick>
          <SectionHead title="Supply to ProSmash" />
          <p className="-mt-4 mb-5 max-w-[62ch] text-[15px]">
            Receive qualified institutional demand matched to your categories,
            quote through a fair structured process, and track purchase orders
            and payments end to end.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <RoleGate show={["visitor", "pending"]}>
              <a href="#" className="inline-flex h-12 items-center rounded-[2px] border border-ink px-6 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white">
                Register as a supplier
              </a>
            </RoleGate>
            <RoleGate show={["supplier"]}>
              <Link href="/supplier" className="inline-flex h-12 items-center rounded-[2px] bg-ember-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-ember-press">
                Open your workspace
              </Link>
            </RoleGate>
          </div>
        </div>
      </section>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getCategories, getFeatured } from "@/lib/catalog";
import { CATEGORY_HERO } from "@/lib/nav-catalogue";
import { HeroCarousel } from "@/components/hero-carousel";
import { ProductGrid } from "@/components/product";
import { RoleGate } from "@/components/role-gate";
import { Bone } from "@/components/skeletons";

/* Home — hero, category grid, featured pricing, how-it-works, supplier band.
   T3a: public full press — display type on the approved scale (33/42/56),
   the 16° section seam, numbered process rail, ink closing band. */

function Kick({ children, onInk = false }: { children: React.ReactNode; onInk?: boolean }) {
  return (
    <div
      className={
        "mb-3 flex items-center gap-3.5 font-mono text-[11px] uppercase tracking-[.08em] " +
        (onInk ? "text-ember after:h-px after:w-16 after:bg-white/20" : "text-ember-deep after:h-px after:w-16 after:bg-n200")
      }
    >
      {children}
    </div>
  );
}

function SectionHead({ title, more, moreHref, onInk = false }: { title: string; more?: string; moreHref?: string; onInk?: boolean }) {
  return (
    <div className="mb-7 flex flex-wrap items-baseline gap-5">
      <h2 className={`stretch-xp font-display text-2xl font-bold tracking-tight md:text-[33px] ${onInk ? "text-chalk" : "text-ink"}`}>
        {title}
      </h2>
      {more && moreHref && (
        <Link href={moreHref} className="ml-auto text-sm font-semibold text-ember-deep hover:underline">
          {more}
        </Link>
      )}
    </div>
  );
}

/** 16° section seam (VISUAL-IDENTITY §6) — the upper ink surface carries
 *  into the next band along the brand angle. Decorative only. */
function SectionCut() {
  return (
    <div aria-hidden className="relative h-10 overflow-hidden bg-chalk md:h-14">
      <div
        className="absolute -left-10 -top-px bottom-0 w-[42%] bg-ink"
        style={{ transform: "skewX(-16deg)", transformOrigin: "top left" }}
      />
    </div>
  );
}

const STEPS: [string, string][] = [
  ["Register and get approved", "Your institution's details are reviewed before ordering is enabled."],
  ["See your price", "Standard prices are public. On approval, your institutional price appears on every product."],
  ["Order with 100% advance", "UPI, card, net banking, NEFT/RTGS or cheque — dispatch after payment is confirmed."],
  ["One counterparty", "Smash Pro manages fulfilment and stays your single point of contact for delivery."],
];

export default function HomePage() {
  // The hero carousel is static (no server data) — render it immediately,
  // outside the data Suspense, so it never waits on the catalogue query and
  // its fixed height causes no layout shift. The data-driven sections below
  // stream behind a layout-true skeleton (Cache Components, library §14).
  return (
    <main>
      <HeroCarousel />
      <SectionCut />
      <Suspense fallback={<HomeSectionsSkeleton />}>
        <HomeSections />
      </Suspense>
    </main>
  );
}

function HomeSectionsSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto max-w-[1280px] px-4 py-12 md:px-10">
      <Bone className="mb-6 h-8 w-72" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => <Bone key={i} className="aspect-[4/5] w-full rounded-[2px]" />)}
      </div>
    </div>
  );
}

async function HomeSections() {
  const [categories, featured] = await Promise.all([getCategories(), getFeatured()]);

  return (
    <>

      {/* categories */}
      <section className="border-b border-n200 bg-chalk pb-11 pt-6 md:pb-16 md:pt-8">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10">
          <Kick>Catalogue</Kick>
          <SectionHead title="Every sport. One platform." more="Browse all →" moreHref="/catalog?cat=cricket" />
          {/* image tile per category — name beneath, no product count.
              Categories without approved imagery show the labelled frame. */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 lg:grid-cols-6">
            {categories.map((c) => {
              const hero = CATEGORY_HERO[c.slug] ?? null;
              return (
                <Link key={c.slug} href={`/catalog?cat=${c.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-n100">
                    {hero ? (
                      <Image
                        src={hero}
                        alt={c.name}
                        fill
                        sizes="(min-width:1024px) 16vw, (min-width:768px) 24vw, 50vw"
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      /* Library §4 placeholder — no substitute imagery */
                      <div className="absolute inset-0 flex items-end justify-center pb-3" aria-hidden>
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)",
                          }}
                        />
                        <span className="relative font-mono text-[9px] uppercase tracking-wide text-n400">
                          imagery pending
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 font-display text-[15px] font-bold leading-tight text-ink underline-offset-4 group-hover:text-ember-deep group-hover:underline md:text-base">
                    {c.name}
                  </div>
                </Link>
              );
            })}
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
          <SectionHead title="How Smash Pro works" />
          {/* numbered rail — the process genuinely is a sequence, so the
              numbering carries information; ticks mark each step on the rail */}
          <div className="grid gap-x-8 gap-y-7 border-t border-n200 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <div key={t} className="relative pt-5">
                <span aria-hidden className="absolute left-0 top-[-2px] h-[3px] w-9 bg-ember-deep" />
                <span className="num font-mono text-[13px] text-n600">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mb-1.5 mt-1.5 font-display text-[17px] font-semibold text-ink">{t}</h3>
                <p className="text-sm text-n600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* supplier band — ink closing panel: the page ends with the same
          gravity it opened with; the 16° accent lives inside the panel */}
      <section id="supply" className="scroll-mt-32 py-11 md:py-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10">
          <div className="relative overflow-hidden rounded-[2px] bg-ink px-5 py-9 md:px-10 md:py-12">
            <div
              aria-hidden
              className="absolute -right-16 -top-10 bottom-0 hidden w-[30%] bg-ink2 md:block"
              style={{ transform: "skewX(-16deg)", transformOrigin: "top left" }}
            />
            <div className="relative">
              <Kick onInk>For manufacturers · wholesalers · distributors · dealers</Kick>
              <SectionHead onInk title="Supply to Smash Pro" />
              <p className="-mt-4 mb-6 max-w-[62ch] text-[15px] text-white/80">
                Receive qualified institutional demand matched to your categories,
                quote through a fair structured process, and track purchase orders
                and payments end to end.
              </p>
              <div className="flex flex-wrap gap-3.5">
                <RoleGate show={["visitor", "pending"]}>
                  <Link href="/register/supplier" className="inline-flex h-12 items-center rounded-[2px] bg-ember-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-ember-press">
                    Register as a supplier
                  </Link>
                </RoleGate>
                <RoleGate show={["supplier"]}>
                  <Link href="/supplier" className="inline-flex h-12 items-center rounded-[2px] bg-ember-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-ember-press">
                    Open your workspace
                  </Link>
                </RoleGate>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getFeatured, getRecommended } from "@/lib/catalog";
import { CATEGORIES } from "@/data/products";
import { CATEGORY_HERO } from "@/lib/nav-catalogue";
import { HeroCarousel } from "@/components/hero-carousel";
import { FirstOrderBanner } from "@/components/first-order-banner";
import { ProductGrid } from "@/components/product";
import { RoleGate } from "@/components/role-gate";
import { Bone } from "@/components/skeletons";

/* Two-journey promo band (PORTAL-PRINCIPLES §2: "Buy for your institution" /
   "Supply to Smash Pro" are the site's only conversions). The supplier half
   already existed at the page foot; this adds its buyer-facing counterpart
   using the same institutional photograph referenced elsewhere on the site
   (public-nav.tsx InstitutionsPanel) — no new imagery introduced. */
function InstitutionPromoBand() {
  return (
    <section className="py-11 md:py-16">
      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        <div className="relative grid overflow-hidden rounded-[2px] border border-n200 bg-chalk md:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col justify-center px-6 py-9 md:px-10 md:py-0">
            <Kick>For schools · academies · colleges · retailers</Kick>
            <h2 className="stretch-xp font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">
              Equip your institution.
            </h2>
            <p className="-mt-1 mb-6 mt-3 max-w-[48ch] text-[15px] text-n600">
              One organisation account, every sport, approved institutional
              pricing on sign-off — register once and order with 100% advance
              payment, managed end to end by Smash Pro.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <RoleGate show={["visitor", "pending"]}>
                <Link href="/register" className="inline-flex h-12 items-center rounded-[2px] bg-ember-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-ember-press">
                  Register your institution
                </Link>
              </RoleGate>
              <RoleGate show={["buyer"]}>
                <Link href="/dashboard" className="inline-flex h-12 items-center rounded-[2px] bg-ember-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-ember-press">
                  Open your dashboard
                </Link>
              </RoleGate>
              <Link href="/catalog?cat=cricket" className="inline-flex h-12 items-center rounded-[2px] border border-n400 px-6 text-sm font-semibold text-ink transition-colors hover:border-ink">
                Browse the catalogue
              </Link>
            </div>
          </div>
          <div className="relative hidden aspect-[16/9] md:block">
            <Image src="/img/hero/slide-institutional.png" alt="" fill sizes="50vw" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-chalk/10" />
          </div>
        </div>
      </div>
    </section>
  );
}

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

/* Proof strip — three confirmed, real platform facts (no invented stats;
   PORTAL-PRINCIPLES §2: "proof over promise", never a fabricated metric).
   Sits on the hero's ink ground as a quiet credibility band before the
   section seam hands off to the paper canvas below. */
function ProofStrip() {
  const FACTS: [string, string][] = [
    ["12", "sports in one wholesale catalogue"],
    ["100%", "advance payment — no postpaid credit"],
    ["1", "counterparty for order, delivery and resolution"],
  ];
  return (
    <div className="border-t border-white/10 bg-ink">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-x-6 gap-y-4 px-4 py-5 sm:grid-cols-3 md:px-10 md:py-6">
        {FACTS.map(([n, label]) => (
          <div key={label} className="flex items-baseline gap-2.5">
            <span className="num font-display text-xl font-bold text-ember md:text-2xl">{n}</span>
            <span className="text-[13px] leading-tight text-white/70 md:text-[13.5px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Two-up merchandising banners — large, image-led entry points into the
   two deepest sample categories today (Cricket, Football). Distinct from
   the full 12-category directory grid below: this is curated highlight,
   that is complete browse. Imagery is the existing category hero set —
   nothing new is introduced. */
function FeatureDuo() {
  const FEATURES: { slug: string; label: string; note: string }[] = [
    { slug: "cricket", label: "Cricket", note: "Bats, protection, kit bags & ground equipment" },
    { slug: "football", label: "Football", note: "Match & training balls for every squad size" },
  ];
  return (
    <section className="border-b border-n200 bg-chalk py-11 md:py-16">
      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        <Kick>Popular with institutions</Kick>
        <SectionHead title="Shop the essentials." />
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const hero = CATEGORY_HERO[f.slug] ?? null;
            return (
              <Link key={f.slug} href={`/catalog?cat=${f.slug}`} className="group relative block overflow-hidden rounded-[2px]">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-n100 sm:aspect-[4/3]">
                  {hero && (
                    <Image
                      src={hero}
                      alt=""
                      fill
                      sizes="(min-width:768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                    />
                  )}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                    <span className="stretch-xp block font-display text-[22px] font-bold text-chalk md:text-[26px]">{f.label}</span>
                    <span className="mt-1 block max-w-[40ch] text-[13px] text-white/80">{f.note}</span>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ember underline-offset-4 group-hover:underline">
                      Shop {f.label.toLowerCase()}
                      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* Single full-width collection banner — one large image, one heading, one
   line of support copy, one CTA. Companion to FeatureDuo's pair; together
   they cover the "collection banners" merchandising slot. Real category
   imagery only (Gym & Fitness), no invented campaign name. */
function SingleCollectionBanner() {
  const hero = CATEGORY_HERO["gym-fitness"] ?? null;
  return (
    <section className="border-b border-n200">
      <Link href="/catalog?cat=gym-fitness" className="group relative block h-[280px] w-full overflow-hidden bg-ink md:h-[360px]">
        {hero && (
          <Image src={hero} alt="" fill sizes="100vw" className="object-cover opacity-80 transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
        )}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/10" />
        <div className="relative mx-auto flex h-full max-w-[1280px] items-center px-4 md:px-10">
          <div className="max-w-[520px]">
            <span className="font-mono text-[11px] uppercase tracking-[.09em] text-ember">Gym &amp; Fitness</span>
            <h2 className="stretch-xp mt-2 font-display text-[30px] font-bold leading-[1.05] tracking-tight text-chalk md:text-[42px]">
              Strength &amp; conditioning, outfitted.
            </h2>
            <p className="mt-3 max-w-[42ch] text-[14px] text-white/80 md:text-[15px]">
              Free weights, plates and training essentials for institutional gyms and conditioning programmes.
            </p>
            <span className="mt-5 inline-flex h-11 items-center rounded-[2px] border border-white/35 px-5 text-sm font-semibold text-white transition-colors group-hover:border-white">
              Shop gym &amp; fitness
            </span>
          </div>
        </div>
      </Link>
    </section>
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

/* Fixed-row category cards (not scrollable — a set 6, matching the
   reference's tile-row placement around the hero). Real categories/
   imagery only, split into two halves by CATEGORIES' own order. */
function CategoryCardsRow({ items }: { items: typeof CATEGORIES }) {
  return (
    <section className="border-b border-n200 bg-chalk py-7 md:py-9">
      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {items.map((c) => {
            const hero = CATEGORY_HERO[c.slug] ?? null;
            return (
              <Link key={c.slug} href={`/catalog?cat=${c.slug}`} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-[2px] border border-n200 bg-n100 transition-colors group-hover:border-ember-deep/40">
                  {hero ? (
                    <Image src={hero} alt={c.name} fill sizes="(min-width:1024px) 16vw, (min-width:640px) 32vw, 48vw" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundImage: "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)" }}>
                      <span className="relative font-mono text-[9px] uppercase tracking-wide text-n400">imagery pending</span>
                    </div>
                  )}
                </div>
                <div className="mt-2.5 text-center font-display text-[14px] font-bold leading-tight text-ink group-hover:text-ember-deep md:text-[15px]">{c.name}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
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
  // CategoryCardsRow is likewise static (CATEGORIES is the real seed data,
  // the same source server/seed.ts uses) — safe to render synchronously
  // either side of the hero, same rationale as the hero itself.
  const firstHalf = CATEGORIES.slice(0, 6);
  const secondHalf = CATEGORIES.slice(6, 12);
  return (
    <main>
      <FirstOrderBanner />
      <CategoryCardsRow items={firstHalf} />
      <HeroCarousel />
      <CategoryCardsRow items={secondHalf} />
      <ProofStrip />
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
  const [featured, recommended] = await Promise.all([getFeatured(), getRecommended()]);

  return (
    <>
      <InstitutionPromoBand />

      <FeatureDuo />

      <SingleCollectionBanner />

      {/* featured + recommended — homepage merchandising */}
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

      <section className="border-t border-n200 bg-chalk py-11 md:py-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10">
          <Kick>Recommended</Kick>
          <SectionHead title="Recommended for institutions." more="All products →" moreHref="/catalog?cat=badminton" />
          <ProductGrid items={recommended} />
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

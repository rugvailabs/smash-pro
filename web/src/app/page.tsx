import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getEquipmentPicks, getFeatured, getRecommended } from "@/lib/catalog";
import { PRICE_BANDS } from "@/lib/filter-defs";
import { inr } from "@/lib/format";
import type { Product } from "@/lib/types";
import { CATEGORIES } from "@/data/products";
import { CATEGORY_HERO } from "@/lib/nav-catalogue";
import { getCategoryHeroMap, getHeroSlides } from "@/server/content";
import { HeroCarousel } from "@/components/hero-carousel";
import { FirstOrderBanner } from "@/components/first-order-banner";
import { ProductGrid } from "@/components/product";
import { RoleGate } from "@/components/role-gate";
import { Bone } from "@/components/skeletons";
import { Container } from "@/components/container";

/* Two-journey promo band (PORTAL-PRINCIPLES §2: "Buy for your institution" /
   "Supply to Smash Pro" are the site's only conversions). The supplier half
   already existed at the page foot; this adds its buyer-facing counterpart
   using the same institutional photograph referenced elsewhere on the site
   (public-nav.tsx InstitutionsPanel) — no new imagery introduced. */
function InstitutionPromoBand() {
  return (
    <section className="py-7 md:py-10 lg:py-12">
      <Container>
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
      </Container>
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
    <div className="mb-5 flex flex-wrap items-baseline gap-5 md:mb-6">
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
    <Container className="py-3">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-[2px] border-t border-white/10 bg-ink px-6 py-5 sm:grid-cols-3 md:px-10 md:py-6 lg:px-14">
        {FACTS.map(([n, label]) => (
          <div key={label} className="flex items-baseline gap-2.5">
            <span className="num font-display text-xl font-bold text-ember md:text-2xl">{n}</span>
            <span className="text-[13px] leading-tight text-white/70 md:text-[13.5px]">{label}</span>
          </div>
        ))}
      </div>
    </Container>
  );
}

/* Two-up merchandising banners — large, image-led entry points into the
   two deepest sample categories today (Cricket, Football). Distinct from
   the full 12-category directory grid below: this is curated highlight,
   that is complete browse. Imagery is the existing category hero set —
   nothing new is introduced. */
function FeatureDuo({ heroMap }: { heroMap: Record<string, string | null> }) {
  const FEATURES: { slug: string; label: string; note: string }[] = [
    { slug: "cricket", label: "Cricket", note: "Bats, protection, kit bags & ground equipment" },
    { slug: "football", label: "Football", note: "Match & training balls for every squad size" },
  ];
  return (
    <section className="bg-chalk py-9 md:py-12 lg:py-14">
      <Container>
        <Kick>Popular with institutions</Kick>
        <SectionHead title="Shop the essentials." />
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const hero = heroMap[f.slug] ?? CATEGORY_HERO[f.slug] ?? null;
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
      </Container>
    </section>
  );
}

/* Single full-width collection banner — one large image, one heading, one
   line of support copy, one CTA. Companion to FeatureDuo's pair; together
   they cover the "collection banners" merchandising slot. Real category
   imagery only (Gym & Fitness), no invented campaign name. */
function SingleCollectionBanner({ heroMap }: { heroMap: Record<string, string | null> }) {
  const hero = heroMap["gym-fitness"] ?? CATEGORY_HERO["gym-fitness"] ?? null;
  return (
    <section className="py-3">
      <Container>
        <Link href="/catalog?cat=gym-fitness" className="group relative block h-[280px] w-full overflow-hidden rounded-[2px] bg-ink md:h-[360px]">
          {hero && (
            <Image src={hero} alt="" fill sizes="100vw" className="object-cover opacity-80 transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
          )}
          <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/10" />
          <div className="relative flex h-full items-center px-6 md:px-10 lg:px-14">
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
      </Container>
    </section>
  );
}

/* Budget-tier browse shortcuts — real, functional links into the
   catalogue's own price-band filter (lib/filter-defs.ts, OBD-03 standard
   listed price), not a decorative/placeholder band. Labels and bands are
   the single source of truth already used by the catalogue sidebar, so
   there's no second set of thresholds to drift out of sync. */
function PriceBandsBand() {
  return (
    <section className="bg-chalk py-9 md:py-12 lg:py-14">
      <Container>
        <Kick>Shop by budget</Kick>
        <SectionHead title="Find the right price point." />
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {Object.entries(PRICE_BANDS).map(([key, b]) => (
            <Link
              key={key}
              href={`/catalog?price=${key}`}
              className="group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-[2px] bg-ink px-4 text-center transition-colors hover:bg-ink2 sm:aspect-[4/3]"
            >
              <span className="stretch-xp font-display text-[22px] font-bold leading-tight text-chalk md:text-[26px]">
                {b.label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ember underline-offset-4 group-hover:underline">
                Shop now
                <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* Cross-category equipment picks — real SKUs (lib/catalog.ts
   getEquipmentPicks), each card showing that product's own real standard
   price. "Onwards" only where the product carries variants, so the claim
   matches what the PDP actually offers. */
function EquipmentPicksBand({ items }: { items: Product[] }) {
  if (items.length === 0) return null;
  return (
    <section className="bg-chalk py-9 md:py-12 lg:py-14">
      <Container>
        <Kick>Popular picks</Kick>
        <SectionHead title="Gear up for the season." />
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {items.map((p) => (
            <Link key={p.sku} href={`/product/${p.sku}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[2px] bg-n100">
              {p.img && (
                <Image
                  src={p.img}
                  alt=""
                  fill
                  sizes="(min-width:1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
                />
              )}
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                <span className="stretch-xp block font-display text-[15px] font-bold leading-snug text-chalk md:text-[17px]">
                  {p.name.split("—")[0].trim()}
                </span>
                <span className="num mt-1 block text-[13px] font-semibold text-ember md:text-[14px]">
                  {inr(p.std)}{p.variantCount && p.variantCount > 1 ? " onwards" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* Fixed-row category cards (not scrollable — a set 6, matching the
   reference's tile-row placement around the hero). Real categories/
   imagery only, split into two halves by CATEGORIES' own order. */
function CategoryCardsRow({ items, heroMap }: { items: typeof CATEGORIES; heroMap: Record<string, string | null> }) {
  return (
    <section className="bg-chalk py-6 md:py-8 lg:py-9">
      <Container>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {items.map((c) => {
            const hero = heroMap[c.slug] ?? CATEGORY_HERO[c.slug] ?? null;
            return (
              <Link key={c.slug} href={`/catalog?cat=${c.slug}`} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-[2px] bg-n100 transition-shadow group-hover:shadow-raised">
                  {hero ? (
                    <Image src={hero} alt="" fill sizes="(min-width:1024px) 16vw, (min-width:640px) 32vw, 48vw" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundImage: "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)" }}>
                      <span className="relative font-mono text-[9px] uppercase tracking-wide text-n400">imagery pending</span>
                    </div>
                  )}
                  {/* blend the image into the card ground — a light scrim rather
                      than the ink one used elsewhere, so it reads against the
                      chalk card background regardless of the photo underneath */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-chalk via-chalk/80 to-transparent"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 px-2.5 pb-2">
                    <span className="block truncate font-display text-[14px] font-bold leading-tight text-ink group-hover:text-ember-deep md:text-[15px]">
                      {c.name}
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
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
  const firstHalf = CATEGORIES.slice(0, 6);
  const secondHalf = CATEGORIES.slice(6, 12);
  return (
    <main>
      <FirstOrderBanner />
      {/* Hero slides and category hero images are admin-editable (ADR-0021,
          site_content table) reads — kept behind their own Suspense boundary,
          same as HomeSections below, so the DB round trip never blocks static
          prerendering of the page shell (Cache Components bails a whole route
          out of static generation if an un-cached dynamic read happens outside
          Suspense). The fallback matches the real layout's height so there's
          no visible shift. */}
      <Suspense fallback={<HeroSectionSkeleton firstHalf={firstHalf} secondHalf={secondHalf} />}>
        <HeroSection firstHalf={firstHalf} secondHalf={secondHalf} />
      </Suspense>
      <ProofStrip />
      <Suspense fallback={<HomeSectionsSkeleton />}>
        <HomeSections />
      </Suspense>
    </main>
  );
}

function HeroSectionSkeleton({ firstHalf, secondHalf }: { firstHalf: typeof CATEGORIES; secondHalf: typeof CATEGORIES }) {
  return (
    <>
      <CategoryCardsRow items={firstHalf} heroMap={{}} />
      <Bone className="h-[480px] w-full rounded-none sm:h-[440px] md:h-[500px] lg:h-[560px] xl:h-[600px]" />
      <CategoryCardsRow items={secondHalf} heroMap={{}} />
    </>
  );
}

async function HeroSection({ firstHalf, secondHalf }: { firstHalf: typeof CATEGORIES; secondHalf: typeof CATEGORIES }) {
  const [slides, heroMap] = await Promise.all([getHeroSlides(), getCategoryHeroMap()]);
  return (
    <>
      <CategoryCardsRow items={firstHalf} heroMap={heroMap} />
      <HeroCarousel slides={slides} />
      <CategoryCardsRow items={secondHalf} heroMap={heroMap} />
    </>
  );
}

function HomeSectionsSkeleton() {
  return (
    <Container aria-busy="true" className="py-12">
      <Bone className="mb-6 h-8 w-72" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => <Bone key={i} className="aspect-[4/5] w-full rounded-[2px]" />)}
      </div>
    </Container>
  );
}

async function HomeSections() {
  const [featured, heroMap] = await Promise.all([getFeatured(), getCategoryHeroMap()]);
  const recommended = await getRecommended(featured.map((p) => p.sku));
  const equipmentPicks = await getEquipmentPicks([...featured, ...recommended].map((p) => p.sku));

  return (
    <>
      <InstitutionPromoBand />

      <FeatureDuo heroMap={heroMap} />

      <SingleCollectionBanner heroMap={heroMap} />

      {/* featured + recommended — homepage merchandising */}
      <section className="py-9 md:py-12 lg:py-14">
        <Container>
          <Kick>Public pricing</Kick>
          <SectionHead title="Wholesale standards, in the open." more="All products →" moreHref="/catalog?cat=cricket" />
          <ProductGrid items={featured} />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-n400">
            prices &amp; discounts are illustrative sample data — configured
            percentages pending owner approval (OBD-20) · imagery is
            representative, CC-licensed (see credits)
          </p>
        </Container>
      </section>

      <section className="bg-chalk py-9 md:py-12 lg:py-14">
        <Container>
          <Kick>Recommended</Kick>
          <SectionHead title="Recommended for institutions." more="All products →" moreHref="/catalog?cat=badminton" />
          <ProductGrid items={recommended} />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-n400">
            prices &amp; discounts are illustrative sample data — configured
            percentages pending owner approval (OBD-20) · imagery is
            representative, CC-licensed (see credits)
          </p>
        </Container>
      </section>

      <EquipmentPicksBand items={equipmentPicks} />

      <PriceBandsBand />

      {/* how it works */}
      <section id="how" className="scroll-mt-32 bg-chalk py-9 md:py-12 lg:py-14">
        <Container>
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
        </Container>
      </section>

      {/* supplier band — ink closing panel: the page ends with the same
          gravity it opened with; the 16° accent lives inside the panel */}
      <section id="supply" className="scroll-mt-32 py-7 md:py-10 lg:py-12">
        <Container>
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
        </Container>
      </section>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getCategories, getFeatured } from "@/lib/catalog";
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
  ["One counterparty", "ProSmash manages fulfilment and stays your single point of contact for delivery."],
];

export default function HomePage() {
  // session-aware pricing makes this route dynamic — the shell streams
  // behind a layout-true skeleton (library §14)
  return (
    <Suspense
      fallback={
        <main aria-busy="true">
          <Bone className="h-[320px] w-full rounded-none md:h-[420px]" />
          <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-10">
            <Bone className="mb-6 h-8 w-72" />
            <div className="grid grid-cols-2 gap-px md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Bone key={i} className="h-24 w-full rounded-none" />)}
            </div>
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
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
          {/* display scale: 33 → 42 → 56 (VISUAL-IDENTITY §3 — public ceiling) */}
          <h1 className="stretch-xp my-4 max-w-[17ch] font-display text-[33px] font-bold leading-[1.1] tracking-[-.02em] text-chalk md:text-[42px] lg:text-[56px]">
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
              <Link href="/register" className="inline-flex h-12 items-center rounded-[2px] border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:border-white">
                Register your institution
              </Link>
            </RoleGate>
          </div>
        </div>
      </section>

      <SectionCut />

      {/* categories */}
      <section className="border-b border-n200 bg-chalk pb-11 pt-6 md:pb-16 md:pt-8">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10">
          <Kick>Catalogue</Kick>
          <SectionHead title="Every sport. One platform." more="Browse all →" moreHref="/catalog?cat=cricket" />
          <div className="grid grid-cols-2 border-l border-t border-n200 md:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/catalog?cat=${c.slug}`}
                className="group flex min-h-[88px] flex-col justify-between border-b border-r border-n200 bg-chalk p-4 transition-colors hover:bg-paper md:min-h-[104px] md:p-[22px]"
              >
                {/* glyph slot reserved — the commissioned sport icon set
                    (VISUAL-IDENTITY §5) drops in beside the name at T3d+ */}
                <span className="font-display text-base font-bold text-ink underline-offset-4 group-hover:underline md:text-[19px]">
                  {c.name}
                </span>
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
              <SectionHead onInk title="Supply to ProSmash" />
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
    </main>
  );
}

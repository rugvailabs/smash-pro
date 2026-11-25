import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/container";

/* ============================================================
   Category hero — the premium banner atop every single-category
   listing page. Court Ink: ink ground, the category's own
   representative imagery behind a left-anchored scrim, ember
   accent rule, chalk type. Presentational and shared by all 12
   categories (content is passed in by the catalogue page).
   ============================================================ */

export function CategoryHero({
  title, description, hero, count,
}: {
  title: string;
  description: string;
  hero: string | null;
  count: number;
}) {
  return (
    <div className="border-b border-n200 bg-paper py-3">
      <Container>
        <section className="relative isolate overflow-hidden rounded-[2px] bg-ink">
          {hero ? (
            <Image src={hero} alt="" fill priority sizes="100vw" className="object-cover object-center opacity-60" />
          ) : null}
          {/* left-anchored scrim keeps the copy legible over any image */}
          <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-ember" />

          <div className="relative px-5 py-9 min-[600px]:px-10 md:py-12 min-[1200px]:px-16">
            <nav aria-label="Breadcrumb" className="mb-3 font-mono text-[11px] uppercase tracking-[.08em] text-white/55">
              <Link href="/" className="hover:text-white">Home</Link>
              <span className="px-1.5">/</span>
              <Link href="/catalog?cat=cricket" className="hover:text-white">Catalogue</Link>
              <span className="px-1.5">/</span>
              <span className="text-white/90">{title}</span>
            </nav>

            <h1 className="font-display text-[30px] font-bold leading-[1.05] tracking-tight text-chalk md:text-[42px]">
              {title}
            </h1>
            <p className="mt-3 max-w-[56ch] text-[14px] leading-relaxed text-white/75 md:text-[15px]">
              {description}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <span className="num inline-flex h-7 items-center rounded-[2px] border border-white/20 bg-white/5 px-2.5 font-mono text-[11px] tracking-wide text-white/80">
                {count} products
              </span>
              <span className="inline-flex h-7 items-center rounded-[2px] border border-white/20 bg-white/5 px-2.5 font-mono text-[11px] uppercase tracking-wide text-white/70">
                Wholesale · GST-inclusive
              </span>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}

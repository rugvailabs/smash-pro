"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRole } from "@/components/providers";

/* ============================================================
   Homepage hero carousel (Court Ink). Six supplied banner images
   used verbatim as backgrounds; all headlines / CTAs are HTML.
   Every banner puts its subject on the right with dark-navy
   negative space on the left — so copy sits left on desktop and
   bottom on mobile, with a subtle ink scrim only where text lands.
   Crossfade transitions, autoplay with pause on hover/focus,
   prev/next + indicators, touch swipe, reduced-motion aware.
   ============================================================ */

interface Slide {
  img: string;
  /** object-position so the subject stays in frame across breakpoints */
  pos: string;
  eyebrow: string;
  titleA: string;
  accent: string;
  titleB: string;
  text: string;
  cta: { label: string; href: string };
  /** institutional slide — CTA is role-aware (register vs browse) */
  institutional?: boolean;
}

const SLIDES: Slide[] = [
  {
    img: "/img/hero/slide-all-sports.png",
    pos: "78% center",
    eyebrow: "Every sport · one catalogue",
    titleA: "Everything Your ",
    accent: "Game",
    titleB: " Demands.",
    text: "From cricket to conditioning — kit every sport from a single wholesale catalogue built for institutions.",
    cta: { label: "Shop the catalogue", href: "/catalog?cat=cricket" },
  },
  {
    img: "/img/hero/slide-athletics.png",
    pos: "70% center",
    eyebrow: "Performance · athletics",
    titleA: "Bring Your ",
    accent: "Vision",
    titleB: " to Life.",
    text: "Track, field and training equipment built to perform when it matters most.",
    cta: { label: "Explore athletics", href: "/catalog?cat=athletics" },
  },
  {
    img: "/img/hero/slide-badminton-action.png",
    pos: "76% center",
    eyebrow: "Badminton",
    titleA: "Own Every ",
    accent: "Rally",
    titleB: ".",
    text: "Tournament racquets, shuttles and court kit for clubs and academies.",
    cta: { label: "Shop badminton", href: "/catalog?cat=badminton" },
  },
  {
    img: "/img/hero/slide-footwear.png",
    pos: "72% center",
    eyebrow: "Sports footwear",
    titleA: "Built for Every ",
    accent: "Move",
    titleB: ".",
    text: "Performance footwear engineered for grip, speed and control.",
    cta: { label: "Browse the range", href: "/catalog?cat=sportswear" },
  },
  {
    img: "/img/hero/slide-badminton-gear.png",
    pos: "68% center",
    eyebrow: "Racquets & gear",
    titleA: "Precision Kit for Every ",
    accent: "Point",
    titleB: ".",
    text: "Match-ready racquets, grips and carry kit for every player on your roster.",
    cta: { label: "Racquets & gear", href: "/catalog?cat=badminton" },
  },
  {
    img: "/img/hero/slide-institutional.png",
    pos: "72% center",
    eyebrow: "For institutions",
    titleA: "Equip Teams. Empower ",
    accent: "Performance",
    titleB: ".",
    text: "Outfit schools, academies and clubs with managed, end-to-end sports supply.",
    cta: { label: "Register your institution", href: "/register" },
    institutional: true,
  },
];

const INTERVAL = 5000;

export function HeroCarousel() {
  const { role } = useRole();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  // The first slide mounts already active; without this it would render at the
  // zoomed-in scale with nothing to animate from. Flipping `started` after the
  // first paint lets slide 0's Ken-Burns zoom run from scale-100 on load, the
  // same way every subsequent slide animates when it becomes active.
  const [started, setStarted] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const r = requestAnimationFrame(() => setStarted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const go = useCallback((n: number) => setIndex(() => (n + SLIDES.length) % SLIDES.length), []);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // autoplay — paused on hover/focus, disabled under reduced-motion
  useEffect(() => {
    if (paused || reduced) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused, reduced]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
  };
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
    touchX.current = null;
  };

  // institutional CTA is role-aware; visitors/pending register, others browse
  const ctaFor = (s: Slide) =>
    s.institutional && role !== "visitor" && role !== "pending"
      ? { label: "Browse the catalogue", href: "/catalog?cat=cricket" }
      : s.cta;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative h-[480px] w-full overflow-hidden bg-ink text-chalk sm:h-[440px] md:h-[500px] lg:h-[560px] xl:h-[600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* stacked slides — crossfade; all mounted so the next never flashes */}
      {SLIDES.map((s, i) => {
        const active = i === index;
        const cta = ctaFor(s);
        return (
          <div
            key={s.img}
            aria-hidden={!active}
            className={
              "absolute inset-0 transition-opacity ease-out " +
              (reduced ? "duration-0" : "duration-[900ms]") +
              (active ? " opacity-100" : " pointer-events-none opacity-0")
            }
          >
            <Image
              src={s.img}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              style={{ objectPosition: s.pos }}
              className={
                "object-cover " +
                (!reduced && active && started
                  ? "scale-[1.08] transition-transform duration-[7000ms] ease-out"
                  : "scale-100")
              }
            />
            {/* subtle ink scrims — only where copy sits (left on desktop, bottom on mobile) */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent md:hidden" aria-hidden />
            <div className="absolute inset-0 hidden bg-gradient-to-r from-ink/85 via-ink/40 to-transparent md:block" aria-hidden />

            {/* copy */}
            <div className="absolute inset-0">
              <div className="mx-auto flex h-full max-w-[1280px] items-end px-4 pb-20 md:items-center md:px-10 md:pb-0">
                <div className="max-w-[90%] sm:max-w-[600px]">
                  <span className="font-mono text-[11px] uppercase tracking-[.09em] text-ember">
                    {s.eyebrow}
                  </span>
                  <h1 className="stretch-xp mt-3 font-display text-[32px] font-bold leading-[1.06] tracking-[-.02em] text-chalk md:text-[46px] lg:text-[58px]">
                    {s.titleA}
                    <em className="not-italic text-ember">{s.accent}</em>
                    {s.titleB}
                  </h1>
                  <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-white/85 md:mt-5 md:text-lg">
                    {s.text}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3.5 md:mt-8">
                    <Link
                      href={cta.href}
                      tabIndex={active ? 0 : -1}
                      className="inline-flex h-12 items-center rounded-[2px] bg-ember-deep px-6 text-sm font-semibold text-white transition-colors hover:bg-ember-press md:h-[52px] md:px-7"
                    >
                      {cta.label}
                    </Link>
                    <Link
                      href="/#how"
                      tabIndex={active ? 0 : -1}
                      className="inline-flex h-12 items-center rounded-[2px] border border-white/30 px-6 text-sm font-semibold text-chalk transition-colors hover:border-white md:h-[52px] md:px-7"
                    >
                      How it works
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* prev / next */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-ink/40 text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-ink/70 md:flex"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-none stroke-current" strokeWidth="2"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-ink/40 text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-ink/70 md:flex"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-none stroke-current" strokeWidth="2"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>

      {/* indicators */}
      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 md:left-auto md:right-10 md:translate-x-0">
        {SLIDES.map((s, i) => (
          <button
            key={s.img}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={
              "h-1.5 rounded-full transition-all " +
              (i === index ? "w-6 bg-ember" : "w-1.5 bg-white/45 hover:bg-white/80")
            }
          />
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Category } from "@/lib/types";
import { CATEGORY_HERO } from "@/lib/nav-catalogue";

/* ============================================================
   Catalogue category rail (library §5): the 12 catalogue
   categories as premium, compact image-led cards in a single
   horizontal rail — native horizontal scroll / touch swipe with
   an edge fade, scroll-snap for a controlled feel. The category
   name sits over a restrained dark scrim with its product count
   beneath; the active category carries the refined Ember accent.

   Motion is CSS (group-hover zoom, native overflow scroll). The
   only script is a mount effect that centres the active card in
   the rail, so the highlighted category is visible on narrow
   screens without the user swiping. Routes, active state and
   counts are unchanged from the previous text strip. Shared by
   the catalogue and search routes.
   ============================================================ */

const HATCH =
  "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)";

export function CategoryStrip({ categories, active }: { categories: Category[]; active?: string }) {
  const railRef = useRef<HTMLDivElement>(null);

  // centre the active card in the rail on load (no page scroll — we only move
  // the rail's own scrollLeft, never call scrollIntoView on the page).
  useEffect(() => {
    if (!active) return;
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>('[data-active="true"]');
    if (!rail || !card) return;
    const target = card.offsetLeft - (rail.clientWidth - card.clientWidth) / 2;
    rail.scrollLeft = Math.max(0, target);
  }, [active]);

  return (
    <nav aria-label="Sport categories" className="border-b border-n200 bg-paper">
      <div
        ref={railRef}
        className="edge-fade-x mx-auto flex w-full max-w-[1600px] snap-x gap-3 overflow-x-auto scroll-pl-5 scroll-pr-5 px-5 py-3.5 min-[600px]:scroll-pl-10 min-[600px]:scroll-pr-10 min-[600px]:px-10 min-[1200px]:scroll-pl-16 min-[1200px]:scroll-pr-16 min-[1200px]:px-16"
      >
      {categories.map((c) => {
        const hero = CATEGORY_HERO[c.slug] ?? null;
        const isActive = c.slug === active;
        return (
          <Link
            key={c.slug}
            href={`/catalog?cat=${c.slug}`}
            aria-current={isActive ? "page" : undefined}
            data-active={isActive ? "true" : undefined}
            className="group relative block shrink-0 snap-start"
          >
            <div
              className={
                "relative aspect-[16/10] w-[158px] overflow-hidden rounded-[3px] border bg-n100 transition-colors " +
                (isActive
                  ? "border-ember-deep ring-1 ring-ember-deep"
                  : "border-n200 group-hover:border-ink/25")
              }
            >
              {hero ? (
                <Image
                  src={hero}
                  alt=""
                  fill
                  sizes="158px"
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.06]"
                />
              ) : (
                <div className="absolute inset-0" style={{ backgroundImage: HATCH }} aria-hidden />
              )}

              {/* restrained dark scrim keeps the label legible on any image */}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" aria-hidden />

              {/* name + count */}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-6">
                <span className="block truncate font-display text-[13px] font-semibold leading-tight text-white">
                  {c.name}
                </span>
                <span className={"num mt-0.5 block font-mono text-[10px] " + (isActive ? "text-ember" : "text-white/65")}>
                  {c.count} items
                </span>
              </span>

              {/* active Ember accent bar */}
              {isActive && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-ember" aria-hidden />
              )}
            </div>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}

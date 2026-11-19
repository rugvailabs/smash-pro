"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Category } from "@/lib/types";
import { CATEGORY_HERO } from "@/lib/nav-catalogue";

const HATCH = "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)";

export function CategoryStrip({ categories, active }: { categories: Category[]; active?: string }) {
  const railRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!active) return;
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>('[data-active="true"]');
    if (!rail || !card) return;
    const target = card.offsetLeft - (rail.clientWidth - card.clientWidth) / 2;
    rail.scrollLeft = Math.max(0, target);
  }, [active]);

  return (
    <nav ref={railRef} aria-label="Sport categories" className="edge-fade-x flex snap-x gap-3 overflow-x-auto border-b border-n200 bg-paper px-4 py-3.5 md:px-10">
      {categories.map((c) => {
        const hero = CATEGORY_HERO[c.slug] ?? null;
        const isActive = c.slug === active;
        return (
          <Link key={c.slug} href={`/catalog/${c.slug}`} aria-current={isActive ? "page" : undefined} data-active={isActive ? "true" : undefined} className="group relative block shrink-0 snap-start">
            <div className={"relative aspect-[16/10] w-[158px] overflow-hidden rounded-[3px] border bg-n100 transition-colors " + (isActive ? "border-ember-deep ring-1 ring-ember-deep" : "border-n200 group-hover:border-ink/25")}>
              {hero ? (
                <Image src={hero} alt="" fill sizes="158px" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.06]" />
              ) : (
                <div className="absolute inset-0" style={{ backgroundImage: HATCH }} aria-hidden />
              )}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" aria-hidden />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-6">
                <span className="block truncate font-display text-[13px] font-semibold leading-tight text-white">{c.name}</span>
                <span className={"num mt-0.5 block font-mono text-[10px] " + (isActive ? "text-ember" : "text-white/65")}>{c.count} items</span>
              </span>
              {isActive && <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-ember" aria-hidden />}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

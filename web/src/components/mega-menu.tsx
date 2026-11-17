"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { buildCatalogueNav, type NavCategory } from "@/lib/nav-catalogue";

/* ============================================================
   Catalogue mega menu — buyer-facing navigation only.

   Exports:
     • MegaMenuDesktop — the "Catalogue" trigger for the header tab
       strip; opens a wide multi-column panel on hover / click / focus.
     • MegaMenuMobile — a touch-friendly accordion for the mobile nav
       drawer.

   This component is ROLE-AGNOSTIC by design: it never reads the session
   role. The parent decides whether to render it (visitor / pending /
   buyer only — suppliers and admins have their own workspaces). Both
   read the static model from buildCatalogueNav(), so opening the menu
   costs zero network round-trips.
   ============================================================ */

const NAV = buildCatalogueNav();

const HATCH =
  "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)";

/* ---------- small mount/visible hook for enter+exit transitions ---------- */
/* Keeps the panel mounted through its close transition. Reduced motion
   (globals.css disables all transitions) simply skips the animation; the
   unmount timer still fires harmlessly. */
function useRevealed(open: boolean, ms = 180) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) {
      // Mount first, then flip to visible on the next frame so the enter
      // transition runs from the hidden state.
      const raf = requestAnimationFrame(() => {
        setMounted(true);
        requestAnimationFrame(() => setShown(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    const raf = requestAnimationFrame(() => setShown(false));
    const timer = setTimeout(() => setMounted(false), ms);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [open, ms]);
  return { mounted, shown };
}

/* ============================================================
   DESKTOP
   ============================================================ */

export function MegaMenuDesktop({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname.startsWith("/catalog");

  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState<string>(NAV[0]?.slug ?? "");
  const [panelTop, setPanelTop] = useState<number>(111);

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const catRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const panelId = useId();
  const { mounted, shown } = useRevealed(open);

  const cat: NavCategory | undefined = NAV.find((c) => c.slug === slug) ?? NAV[0];

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleOpen = () => {
    clearTimers();
    openTimer.current = setTimeout(() => setOpen(true), 80);
  };
  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  const close = useCallback((returnFocus = false) => {
    clearTimers();
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Anchor the fixed panel to the bottom of the trigger; keep it aligned
  // while the sticky header/strip move under scroll or on resize.
  useEffect(() => {
    if (!mounted) return;
    const measure = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (r) setPanelTop(Math.round(r.bottom));
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [mounted]);

  // Close on route change (deferred a frame so the close runs outside render).
  useEffect(() => {
    const raf = requestAnimationFrame(() => close());
    return () => cancelAnimationFrame(raf);
  }, [pathname, close]);

  // Close on outside pointer + Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => clearTimers, []);

  const go = () => {
    close();
    onNavigate?.();
  };

  const focusCat = (i: number) => {
    const n = NAV.length;
    const idx = ((i % n) + n) % n;
    setSlug(NAV[idx].slug);
    catRefs.current[idx]?.focus();
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusCat(0));
    } else if (e.key === "Escape") {
      close();
    }
  };

  const onCatKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowDown") { e.preventDefault(); focusCat(i + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focusCat(i - 1); }
    else if (e.key === "Home") { e.preventDefault(); focusCat(0); }
    else if (e.key === "End") { e.preventDefault(); focusCat(NAV.length - 1); }
    else if (e.key === "ArrowRight") {
      e.preventDefault();
      wrapRef.current?.querySelector<HTMLElement>("[data-panel-first]")?.focus();
    }
  };

  return (
    <div
      ref={wrapRef}
      className="flex"
      onPointerEnter={scheduleOpen}
      onPointerLeave={scheduleClose}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={mounted ? panelId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
        onFocus={() => clearTimers()}
        onKeyDown={onTriggerKey}
        className={
          "flex h-[46px] items-center gap-1.5 whitespace-nowrap px-3.5 text-sm font-medium " +
          (active || open
            ? "font-semibold text-ink shadow-[inset_0_-2px_0_var(--color-ember)]"
            : "text-n800 hover:text-ink")
        }
      >
        Catalogue
        <svg
          viewBox="0 0 24 24" aria-hidden
          className={"h-3.5 w-3.5 fill-none stroke-current transition-transform duration-150 " + (open ? "rotate-180" : "")}
          strokeWidth="2.2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {mounted && cat && (
        <div
          id={panelId}
          aria-label="Catalogue"
          className="pointer-events-none fixed inset-x-0 z-30"
          style={{ top: panelTop }}
        >
          <div className="mx-auto max-w-[1280px] px-4 md:px-10">
            <div
              className={
                "pointer-events-auto overflow-hidden rounded-b-[4px] border border-t-0 border-n200 bg-chalk shadow-overlay transition-all duration-150 ease-out " +
                (shown ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0")
              }
            >
              <div className="grid grid-cols-[232px_1fr]">
                {/* Left: the 12 categories */}
                <ul className="border-r border-n200 py-2" role="menu" aria-label="Catalogue categories">
                  {NAV.map((c, i) => {
                    const on = c.slug === slug;
                    return (
                      <li key={c.slug} role="presentation">
                        <Link
                          ref={(el) => { catRefs.current[i] = el; }}
                          href={c.href}
                          role="menuitem"
                          onClick={go}
                          onPointerEnter={() => setSlug(c.slug)}
                          onFocus={() => setSlug(c.slug)}
                          onKeyDown={(e) => onCatKey(e, i)}
                          className={
                            "flex items-center justify-between gap-2 px-5 py-2 text-[14px] " +
                            (on
                              ? "bg-n100 font-semibold text-ink shadow-[inset_2px_0_0_var(--color-ember)]"
                              : "font-medium text-n800 hover:bg-n100 hover:text-ink")
                          }
                        >
                          {c.label}
                          <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 shrink-0 fill-none stroke-current opacity-60" strokeWidth="2">
                            <path d="M9 6l6 6-6 6" />
                          </svg>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Right: the active category's detail */}
                <div className="grid grid-cols-[1fr_280px] gap-8 p-7">
                  <div className="min-w-0">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <h3 className="font-display text-[15px] font-bold text-ink">{cat.label}</h3>
                      <Link
                        href={cat.href}
                        data-panel-first
                        onClick={go}
                        className="shrink-0 font-mono text-[11px] uppercase tracking-[.07em] text-ember-deep underline-offset-4 hover:underline"
                      >
                        View all {cat.label} →
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-5 lg:grid-cols-3">
                      {cat.subs.map((sub) => (
                        <div key={sub.label} className="min-w-0">
                          <Link
                            href={sub.href}
                            onClick={go}
                            className="block font-mono text-[10px] uppercase tracking-[.08em] text-n600 underline-offset-2 hover:text-ink hover:underline"
                          >
                            {sub.label}
                          </Link>
                          <ul className="mt-2 space-y-1.5">
                            {sub.skus.map((s) => (
                              <li key={s.sku}>
                                <Link
                                  href={s.href}
                                  onClick={go}
                                  className="block truncate text-[13px] leading-snug text-n800 underline-offset-2 hover:text-ink hover:underline"
                                  title={s.name}
                                >
                                  {s.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {cat.popular.length > 0 && (
                      <div className="mt-6 border-t border-n100 pt-4">
                        <span className="font-mono text-[10px] uppercase tracking-[.08em] text-n400">Popular</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {cat.popular.map((s) => (
                            <Link
                              key={s.sku}
                              href={s.href}
                              onClick={go}
                              className="rounded-[2px] border border-n200 px-2.5 py-1 text-[12px] text-n800 hover:border-n400 hover:text-ink"
                              title={s.name}
                            >
                              {s.name.split(" — ")[0]}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Featured imagery (or placeholder frame) */}
                  <Link href={cat.href} onClick={go} className="group relative hidden self-stretch overflow-hidden rounded-[2px] border border-n200 lg:block" aria-label={`View all ${cat.label}`}>
                    {cat.hero ? (
                      <Image
                        src={cat.hero}
                        alt={`${cat.label} — representative image`}
                        fill
                        sizes="280px"
                        className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundImage: HATCH }}>
                        <span className="bg-n100 px-1 text-center font-mono text-[9px] uppercase tracking-wide text-n400">
                          imagery pending
                        </span>
                      </div>
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[.07em] text-white">
                      {cat.label}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MOBILE — accordion for the nav drawer (on-ink)
   ============================================================ */

export function MegaMenuMobile({ onNavigate }: { onNavigate?: () => void }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const baseId = useId();

  return (
    <div>
      {NAV.map((c) => {
        const expanded = openSlug === c.slug;
        const regionId = `${baseId}-${c.slug}`;
        return (
          <div key={c.slug} className="border-b border-white/10 last:border-b-0">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={regionId}
              onClick={() => setOpenSlug(expanded ? null : c.slug)}
              className="flex h-[52px] w-full items-center justify-between px-5 font-display text-base font-semibold text-white/85"
            >
              {c.label}
              <svg
                viewBox="0 0 24 24" aria-hidden
                className={"h-4 w-4 fill-none stroke-current transition-transform duration-150 " + (expanded ? "rotate-180" : "")}
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {expanded && (
              <div id={regionId} className="bg-ink2 pb-2">
                <Link
                  href={c.href}
                  onClick={onNavigate}
                  className="flex h-11 items-center px-5 font-mono text-[11px] uppercase tracking-[.07em] text-ember underline-offset-2 hover:underline"
                >
                  View all {c.label} →
                </Link>
                <ul>
                  {c.subs.map((sub) => (
                    <li key={sub.label}>
                      <Link
                        href={sub.href}
                        onClick={onNavigate}
                        className="flex h-11 items-center px-5 text-[15px] text-white/75 hover:text-white"
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

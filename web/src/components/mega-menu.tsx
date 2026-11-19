"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { buildCatalogueNav, CATALOGUE_POPULAR } from "@/lib/nav-catalogue";
import { SPORT_GROUPS, TextGroupsPanel } from "@/components/nav-groups";

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
  const [panelTop, setPanelTop] = useState<number>(130);

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const panelId = useId();
  const { mounted, shown } = useRevealed(open);

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

  const openAndFocus = () => {
    setOpen(true);
    requestAnimationFrame(() =>
      wrapRef.current?.querySelector<HTMLElement>("[data-panel-item]")?.focus()
    );
  };
  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAndFocus();
    } else if (e.key === "Escape") {
      close();
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
          "flex h-[50px] items-center gap-1.5 whitespace-nowrap px-3.5 text-sm font-medium " +
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

      {mounted && (
        <div
          id={panelId}
          aria-label="Catalogue"
          className="pointer-events-none fixed inset-x-0 z-30"
          style={{ top: panelTop }}
        >
          <div className="mx-auto max-w-[1360px] px-4 md:px-10">
            <div
              className={
                "pointer-events-auto overflow-hidden rounded-b-[4px] border border-t-0 border-n200 bg-chalk shadow-overlay transition-all duration-150 ease-out " +
                (shown ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0")
              }
            >
              {/* Buyer-only reassurance: institutional pricing is live. No prices
                  are shown here — applicable prices resolve at the catalogue/PDP
                  boundary for THIS organisation only. */}
              <div className="flex items-center justify-between gap-4 border-b border-n200 bg-paper px-6 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-[13px] text-ink">
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />
                  <b className="font-semibold">Your institutional pricing is active</b>
                  <span className="hidden truncate text-n600 sm:inline">— your applicable prices show across the catalogue.</span>
                </span>
                <Link
                  href="/catalog?cat=cricket"
                  data-panel-item
                  onClick={go}
                  className="shrink-0 font-mono text-[11px] uppercase tracking-[.07em] text-ember-deep underline-offset-4 hover:underline"
                >
                  Browse full catalogue →
                </Link>
              </div>

              <div className="grid grid-cols-[1fr_280px]">
                {/* LEFT — dense multi-column sport/category index (same
                    density as public-nav.tsx's equivalent panel) */}
                <TextGroupsPanel groups={SPORT_GROUPS} go={go} />

                {/* RIGHT — Popular products */}
                <div className="flex flex-col border-l border-n200 bg-paper/40 px-7 py-6">
                  <h3 className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[.14em] text-ember-deep">Popular products</h3>
                  <ul className="space-y-1.5">
                    {CATALOGUE_POPULAR.map((s) => (
                      <li key={s.sku}>
                        <Link
                          href={s.href}
                          data-panel-item
                          onClick={go}
                          title={s.name}
                          className="block truncate text-[13px] text-n800 underline-offset-2 hover:text-ember-deep hover:underline"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
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
      {/* buyer reassurance — institutional pricing is live (no prices shown) */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-ink2 px-5 py-2.5 text-[12.5px] text-white/80">
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />
        <span><b className="font-semibold text-white">Institutional pricing active</b> — your prices show across the catalogue.</span>
      </div>
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

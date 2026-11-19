"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SPORT_GROUPS, INSTITUTIONS_GROUPS, HOW_GROUPS, SUPPLIER_GROUPS,
  TextGroupsPanel, TextGroupsMobile,
} from "@/components/nav-groups";

/* ============================================================
   Public website navigation. Four dense multi-column TEXT mega
   menus (same structural density across every tab): Sports &
   Equipment · For Institutions · How It Works · For Suppliers.
   Rendered for visitor / pending only — logged-in roles keep
   their workspace nav (chrome.tsx decides).

   One shared open-state drives a single full-width panel, so only
   one mega is ever open; moving between triggers switches it
   instantly, outside-click / Escape close it, and the panel is
   `fixed` (out of flow) so opening it never shifts the page.
   Every link points at an existing route.
   ============================================================ */

type Key = "sports" | "institutions" | "how" | "suppliers";

const PANEL_GROUPS = {
  sports: SPORT_GROUPS,
  institutions: INSTITUTIONS_GROUPS,
  how: HOW_GROUPS,
  suppliers: SUPPLIER_GROUPS,
} as const;

const PANEL_LABEL: Record<Key, string> = {
  sports: "Sports & Equipment",
  institutions: "For Institutions",
  how: "How It Works",
  suppliers: "For Suppliers",
};

/* ============================================================
   DESKTOP — the five-item bar + one shared panel
   ============================================================ */

export function PublicNavDesktop() {
  const pathname = usePathname();
  const [openKey, setOpenKey] = useState<Key | null>(null);
  const [shown, setShown] = useState(false);
  const [panelTop, setPanelTop] = useState(130);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clearTimers = () => { clearTimeout(openTimer.current); clearTimeout(closeTimer.current); };

  const close = useCallback(() => { clearTimers(); setOpenKey(null); }, []);

  // reveal transition — defer both edges off the effect body (no sync setState)
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(openKey !== null));
    return () => cancelAnimationFrame(r);
  }, [openKey]);

  // anchor the fixed panel to the strip's bottom edge, kept aligned on scroll/resize
  useEffect(() => {
    if (!openKey) return;
    const measure = () => { const r = stripRef.current?.getBoundingClientRect(); if (r) setPanelTop(Math.round(r.bottom)); };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); };
  }, [openKey]);

  // close on route change
  useEffect(() => { const r = requestAnimationFrame(() => close()); return () => cancelAnimationFrame(r); }, [pathname, close]);

  // outside pointer + Escape
  useEffect(() => {
    if (!openKey) return;
    const onDown = (e: PointerEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [openKey, close]);

  useEffect(() => clearTimers, []);

  // hover intent — switch instantly when already open, else a small open delay
  const hover = (key: Key) => {
    clearTimers();
    if (openKey) setOpenKey(key);
    else openTimer.current = setTimeout(() => setOpenKey(key), 80);
  };
  const hoverShopAll = () => { clearTimers(); setOpenKey(null); };
  const enterNav = () => clearTimers();
  const leaveNav = () => { clearTimers(); closeTimer.current = setTimeout(() => setOpenKey(null), 140); };

  const toggle = (key: Key) => setOpenKey((k) => (k === key ? null : key));
  const openAndFocus = (key: Key) => { setOpenKey(key); requestAnimationFrame(() => wrapRef.current?.querySelector<HTMLElement>("[data-panel-item]")?.focus()); };

  const triggerKey = (e: React.KeyboardEvent, key: Key) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); openAndFocus(key); }
    else if (e.key === "Escape") close();
  };

  const go = () => close();
  const baseItem = "flex h-[50px] items-center gap-1.5 whitespace-nowrap px-3.5 text-sm font-medium transition-colors";
  const idle = "text-n800 hover:text-ink";
  const activeCls = "font-semibold text-ink shadow-[inset_0_-2px_0_var(--color-ember)]";

  const trigger = (key: Key) => (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={openKey === key}
      onClick={() => toggle(key)}
      onPointerEnter={() => hover(key)}
      onFocus={() => setOpenKey(key)}
      onKeyDown={(e) => triggerKey(e, key)}
      className={baseItem + " " + (openKey === key ? activeCls : idle)}
    >
      {PANEL_LABEL[key]}
      <svg viewBox="0 0 24 24" aria-hidden className={"h-3.5 w-3.5 fill-none stroke-current transition-transform duration-150 " + (openKey === key ? "rotate-180" : "")} strokeWidth="2.2"><path d="M6 9l6 6 6-6" /></svg>
    </button>
  );

  return (
    <div ref={wrapRef} className="flex" onPointerEnter={enterNav} onPointerLeave={leaveNav}>
      <div ref={stripRef} className="flex">
        <Link
          href="/catalog?cat=cricket"
          onPointerEnter={hoverShopAll}
          className={baseItem + " " + (pathname.startsWith("/catalog") ? activeCls : idle)}
        >
          Shop All
        </Link>
        {trigger("sports")}
        {trigger("institutions")}
        {trigger("how")}
        {trigger("suppliers")}
      </div>

      {openKey && (
        <div className="pointer-events-none fixed inset-x-0 z-30" style={{ top: panelTop }} aria-label={PANEL_LABEL[openKey]}>
          <div className="mx-auto max-w-[1360px] px-4 md:px-10">
            <div className={"pointer-events-auto overflow-hidden rounded-b-[4px] border border-t-0 border-n200 bg-chalk shadow-overlay transition-all duration-150 ease-out " + (shown ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0")}>
              <TextGroupsPanel groups={PANEL_GROUPS[openKey]} go={go} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MOBILE — accordion sections for the nav drawer (on ink)
   ============================================================ */

const KEYS: Key[] = ["sports", "institutions", "how", "suppliers"];

function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex h-[52px] w-full items-center justify-between px-5 font-display text-base font-semibold text-white/85">
        {title}
        <svg viewBox="0 0 24 24" aria-hidden className={"h-4 w-4 fill-none stroke-current transition-transform duration-150 " + (open ? "rotate-180" : "")} strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && <div className="bg-ink2 pb-2">{children}</div>}
    </div>
  );
}

export function PublicNavMobile({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div>
      <Link href="/catalog?cat=cricket" onClick={onNavigate} className="flex h-[52px] items-center border-b border-white/10 px-5 font-display text-base font-semibold text-white/85">
        Shop All
      </Link>
      {KEYS.map((key) => (
        <MobileSection key={key} title={PANEL_LABEL[key]}>
          <TextGroupsMobile groups={PANEL_GROUPS[key]} onNavigate={onNavigate} />
        </MobileSection>
      ))}
    </div>
  );
}

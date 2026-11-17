"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SPORT_TILES, EQUIPMENT_TILES, INSTITUTIONS_LINKS, INSTITUTIONS_CTA,
  HOW_STEPS, SUPPLIER_LINKS, type NavTile,
} from "@/lib/nav-catalogue";

/* ============================================================
   Public website navigation (header redesign). Five items:
   Shop All · Sports & Equipment · For Institutions · How It
   Works · For Suppliers. Rendered for visitor / pending only —
   logged-in roles keep their workspace nav (chrome.tsx decides).

   One shared open-state drives a single full-width panel, so only
   one mega is ever open; moving between triggers switches it
   instantly, outside-click / Escape close it, and the panel is
   `fixed` (out of flow) so opening it never shifts the page.
   Every link points at an existing route.
   ============================================================ */

const HATCH =
  "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)";

type Key = "sports" | "institutions" | "how" | "suppliers";

/* one-line descriptors for the equipment rows (presentational copy only —
   routes and names come from the catalogue model, never invented here). */
const EQUIP_NOTE: Record<string, string> = {
  "gym-fitness": "Strength, conditioning & recovery",
  sportswear: "Jerseys, team kit & training wear",
  accessories: "Bags, guards & match-day essentials",
};

/* small uppercase section label (Inter), ember — paired with a quiet "View all" */
function SectionLabel({ title, href, go }: { title: string; href: string; go: () => void }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h3 className="text-[10.5px] font-semibold uppercase tracking-[.14em] text-ember-deep">{title}</h3>
      <Link href={href} data-panel-item onClick={go} className="shrink-0 text-[10.5px] font-medium uppercase tracking-[.08em] text-n600 underline-offset-4 transition-colors hover:text-ink hover:underline">
        View all →
      </Link>
    </div>
  );
}

/* LEFT group — compact sport tile: bordered image with the label set below
   it (navigation, not a gallery overlay). Subtle zoom + ink→ember on hover. */
function SportTile({ t, onNavigate }: { t: NavTile; onNavigate: () => void }) {
  return (
    <Link href={t.href} onClick={onNavigate} data-panel-item className="group block">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[2px] border border-n200 bg-n100 transition-colors group-hover:border-ink/25">
        {t.hero ? (
          <Image src={t.hero} alt="" fill sizes="180px" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.06]" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundImage: HATCH }}>
            <span className="bg-n100 px-1 font-mono text-[9px] uppercase tracking-wide text-n400">imagery pending</span>
          </div>
        )}
      </div>
      <span className="mt-1.5 block font-display text-[12.5px] font-semibold tracking-tight text-ink transition-colors group-hover:text-ember-deep">
        {t.label}
      </span>
    </Link>
  );
}

/* RIGHT group — elegant horizontal image-and-text row, hairline separated. */
function EquipmentRow({ t, onNavigate }: { t: NavTile; onNavigate: () => void }) {
  return (
    <Link href={t.href} onClick={onNavigate} data-panel-item className="group flex items-center gap-3.5 border-b border-n100 py-3.5 last:border-b-0">
      <div className="relative h-[52px] w-[72px] shrink-0 overflow-hidden rounded-[2px] border border-n200 bg-n100 transition-colors group-hover:border-ink/25">
        {t.hero ? (
          <Image src={t.hero} alt="" fill sizes="72px" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.07]" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundImage: HATCH }}>
            <span className="bg-n100 px-1 font-mono text-[8px] uppercase tracking-wide text-n400">pending</span>
          </div>
        )}
      </div>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[14px] font-semibold tracking-tight text-ink transition-colors group-hover:text-ember-deep">{t.label}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-n600">{EQUIP_NOTE[t.slug] ?? ""}</span>
      </span>
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 translate-x-0 fill-none stroke-n400 stroke-2 transition-all duration-200 group-hover:translate-x-0.5 group-hover:stroke-ember-deep">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}

function GroupHead({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h3 className="font-mono text-[11px] uppercase tracking-[.09em] text-ember-deep">{title}</h3>
      <Link href={href} data-panel-item className="shrink-0 font-mono text-[11px] uppercase tracking-[.07em] text-n600 underline-offset-4 hover:text-ink hover:underline">
        {cta} →
      </Link>
    </div>
  );
}

/* ---------- the four panels (presentational) ---------- */

function SportsPanel({ go }: { go: () => void }) {
  return (
    <div className="grid grid-cols-[58fr_42fr]">
      {/* LEFT ~58% — Shop by Sport: compact, consistent image-tile grid */}
      <div className="px-6 py-5">
        <SectionLabel title="Shop by Sport" href="/catalog?cat=cricket" go={go} />
        <div className="grid grid-cols-3 gap-x-3.5 gap-y-3.5">
          {SPORT_TILES.map((t) => <SportTile key={t.slug} t={t} onNavigate={go} />)}
        </div>
      </div>
      {/* RIGHT ~42% — Shop by Equipment: horizontal image-and-text rows,
          vertically centred so the short list reads as composed, not stretched */}
      <div className="flex flex-col border-l border-n200 bg-paper/40 px-6 py-5">
        <SectionLabel title="Shop by Equipment" href="/catalog?cat=gym-fitness" go={go} />
        <div className="flex flex-1 flex-col justify-center">
          {EQUIPMENT_TILES.map((t) => <EquipmentRow key={t.slug} t={t} onNavigate={go} />)}
        </div>
      </div>
    </div>
  );
}

function InstitutionsPanel({ go }: { go: () => void }) {
  return (
    <div className="grid grid-cols-[320px_1fr] gap-9 p-7">
      <div className="flex flex-col">
        <h3 className="font-display text-[20px] font-bold leading-tight text-ink">Equip teams. Empower performance.</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-n600">
          Approved institutional pricing, one organisation account across every
          sport, and supply managed end to end by Smash Pro.
        </p>
        <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-[2px] border border-n200">
          <Image src="/img/hero/slide-institutional.png" alt="" fill sizes="320px" className="object-cover" />
        </div>
        <Link href={INSTITUTIONS_CTA.href} data-panel-item onClick={go} className="mt-4 inline-flex h-11 items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press">
          {INSTITUTIONS_CTA.label} →
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-x-7 gap-y-1 border-l border-n200 pl-9">
        {INSTITUTIONS_LINKS.map((l) => (
          <li key={l.label}>
            <Link href={l.href} data-panel-item onClick={go} className="group block rounded-[2px] py-2.5">
              <span className="block text-[14px] font-semibold text-ink group-hover:text-ember-deep">{l.label}</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-n600">{l.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HowPanel({ go }: { go: () => void }) {
  return (
    <div className="p-7">
      <GroupHead title="How Smash Pro works" href="/#how" cta="Full process" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
        {HOW_STEPS.map((s, i) => (
          <Link key={s.label} href={s.href} data-panel-item onClick={go} className="group relative block border-t-2 border-n200 pt-4 hover:border-ember-deep">
            <span className="num font-mono text-[13px] text-n600">{String(i + 1).padStart(2, "0")}</span>
            <span className="mt-1 block font-display text-[15px] font-semibold text-ink group-hover:text-ember-deep">{s.label}</span>
            <span className="mt-1 block text-[12.5px] leading-snug text-n600">{s.note}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SuppliersPanel({ go }: { go: () => void }) {
  return (
    <div className="grid grid-cols-[300px_1fr] gap-9 p-7">
      <div className="flex flex-col">
        <h3 className="font-display text-[20px] font-bold leading-tight text-ink">Supply to Smash Pro.</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-n600">
          Receive qualified institutional demand matched to your categories,
          quote through a fair structured process, and track purchase orders and
          payments end to end.
        </p>
        <Link href="/register/supplier" data-panel-item onClick={go} className="mt-4 inline-flex h-11 items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press">
          Become a supplier →
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-x-7 gap-y-1 border-l border-n200 pl-9">
        {SUPPLIER_LINKS.map((l) => (
          <li key={l.label}>
            <Link href={l.href} data-panel-item onClick={go} className="group block rounded-[2px] py-2.5">
              <span className="block text-[14px] font-semibold text-ink group-hover:text-ember-deep">{l.label}</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-n600">{l.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  const [panelTop, setPanelTop] = useState(111);

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
  const baseItem = "flex h-[46px] items-center gap-1.5 whitespace-nowrap px-3.5 text-sm font-medium transition-colors";
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
          <div className="mx-auto max-w-[1280px] px-4 md:px-10">
            <div className={"pointer-events-auto overflow-hidden rounded-b-[4px] border border-t-0 border-n200 bg-chalk shadow-overlay transition-all duration-150 ease-out " + (shown ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0")}>
              {openKey === "sports" && <SportsPanel go={go} />}
              {openKey === "institutions" && <InstitutionsPanel go={go} />}
              {openKey === "how" && <HowPanel go={go} />}
              {openKey === "suppliers" && <SuppliersPanel go={go} />}
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

function mobileTileRow(t: NavTile, onNavigate?: () => void) {
  return (
    <Link key={t.slug} href={t.href} onClick={onNavigate} className="flex h-11 items-center px-5 text-[15px] text-white/75 hover:text-white">
      {t.label}
    </Link>
  );
}
function mobileLinkRow(l: { label: string; href: string }, onNavigate?: () => void) {
  return (
    <Link key={l.label} href={l.href} onClick={onNavigate} className="flex h-11 items-center px-5 text-[15px] text-white/75 hover:text-white">
      {l.label}
    </Link>
  );
}

export function PublicNavMobile({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div>
      <Link href="/catalog?cat=cricket" onClick={onNavigate} className="flex h-[52px] items-center border-b border-white/10 px-5 font-display text-base font-semibold text-white/85">
        Shop All
      </Link>
      <MobileSection title="Shop by Sport">
        {SPORT_TILES.map((t) => mobileTileRow(t, onNavigate))}
        <Link href="/catalog?cat=cricket" onClick={onNavigate} className="flex h-11 items-center px-5 font-mono text-[11px] uppercase tracking-[.07em] text-ember">View all sports →</Link>
      </MobileSection>
      <MobileSection title="Shop by Equipment">
        {EQUIPMENT_TILES.map((t) => mobileTileRow(t, onNavigate))}
        <Link href="/catalog?cat=gym-fitness" onClick={onNavigate} className="flex h-11 items-center px-5 font-mono text-[11px] uppercase tracking-[.07em] text-ember">View all equipment →</Link>
      </MobileSection>
      <MobileSection title="For Institutions">
        {INSTITUTIONS_LINKS.map((l) => mobileLinkRow(l, onNavigate))}
        <Link href={INSTITUTIONS_CTA.href} onClick={onNavigate} className="flex h-11 items-center px-5 font-mono text-[11px] uppercase tracking-[.07em] text-ember">{INSTITUTIONS_CTA.label} →</Link>
      </MobileSection>
      <MobileSection title="How It Works">
        {HOW_STEPS.map((l) => mobileLinkRow(l, onNavigate))}
      </MobileSection>
      <MobileSection title="For Suppliers">
        {SUPPLIER_LINKS.map((l) => mobileLinkRow(l, onNavigate))}
      </MobileSection>
    </div>
  );
}

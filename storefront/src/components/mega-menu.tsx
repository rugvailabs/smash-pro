"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/nav-catalogue";

/* ============================================================
   Storefront navigation — four tabs (All Sports / For Institutions /
   How It Works / Support), each a dense multi-column TEXT mega menu
   (grouped headers + plain link lists) — the same structural density
   across every tab. Built entirely from our own real categories and
   content, not any competitor's taxonomy, copy or demographic
   segmentation (we have no consumer Men/Women/Kids data model).
   ============================================================ */

type Key = "sports" | "institutions" | "how" | "support";
const PANEL_LABEL: Record<Key, string> = {
  sports: "All Sports",
  institutions: "For Institutions",
  how: "How It Works",
  support: "Support",
};

type Group = { title: string; items: { label: string; href: string }[] };

const tile = (slug: string) => ({ label: CATEGORY_LABELS[slug] ?? slug, href: `/catalog/${slug}` });

const SPORT_GROUPS: Group[] = [
  {
    title: "Quick Links",
    items: [
      { label: "Browse all categories", href: "/catalog" },
      { label: "Register your institution", href: "/register" },
      { label: "How ordering works", href: "/#how" },
    ],
  },
  { title: "Team Sports", items: ["cricket", "football", "basketball", "volleyball"].map(tile) },
  { title: "Racket Sports", items: ["badminton", "tennis"].map(tile) },
  { title: "Track, Field & Fitness", items: ["athletics", "gym-fitness"].map(tile) },
  { title: "Games", items: ["indoor-games", "outdoor-games"].map(tile) },
  { title: "Apparel & Gear", items: ["sportswear", "accessories"].map(tile) },
];

const INSTITUTIONS_GROUPS: Group[] = [
  {
    title: "Buyer Types",
    items: [
      { label: "Schools & Colleges", href: "/register" },
      { label: "Sports Academies", href: "/register" },
      { label: "Retail Shops", href: "/register" },
      { label: "Other Institutions", href: "/register" },
    ],
  },
  {
    title: "Get Started",
    items: [
      { label: "Register your institution", href: "/register" },
      { label: "Sign in", href: "/account" },
      { label: "Browse the catalogue", href: "/catalog" },
    ],
  },
  {
    title: "Why Smash Pro",
    items: [
      { label: "How ordering works", href: "/#how" },
      { label: "Institutional pricing", href: "/#how" },
      { label: "One counterparty, always", href: "/support" },
    ],
  },
];

const HOW_GROUPS: Group[] = [
  {
    title: "The Process",
    items: [
      { label: "Catalogue discovery", href: "/catalog" },
      { label: "Register your institution", href: "/register" },
      { label: "Approval & pricing", href: "/#how" },
      { label: "Order with confidence", href: "/#how" },
    ],
  },
  {
    title: "Payments",
    items: [
      { label: "Payment methods", href: "/#how" },
      { label: "100% advance, no credit", href: "/#how" },
    ],
  },
  {
    title: "Get Help",
    items: [
      { label: "Help centre", href: "/support" },
      { label: "Track an order", href: "/account/orders" },
    ],
  },
];

const SUPPORT_GROUPS: Group[] = [
  {
    title: "Get Help",
    items: [
      { label: "Help centre", href: "/support" },
      { label: "Contact the team", href: "/support" },
      { label: "WhatsApp the team", href: "https://wa.me/910000000000" },
    ],
  },
  {
    title: "Your Account",
    items: [
      { label: "Sign in", href: "/account" },
      { label: "Track an order", href: "/account/orders" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Policies",
    items: [
      { label: "Returns & policies", href: "/support/policies" },
      { label: "Payment terms", href: "/support/policies" },
    ],
  },
];

const PANEL_GROUPS: Record<Key, Group[]> = {
  sports: SPORT_GROUPS,
  institutions: INSTITUTIONS_GROUPS,
  how: HOW_GROUPS,
  support: SUPPORT_GROUPS,
};
const PANEL_COLS: Record<Key, string> = {
  sports: "grid-cols-6",
  institutions: "grid-cols-3",
  how: "grid-cols-3",
  support: "grid-cols-3",
};

function TextGroupsPanel({ panelKey, go }: { panelKey: Key; go: () => void }) {
  return (
    <div className={"grid gap-x-10 gap-y-2 p-7 " + PANEL_COLS[panelKey]}>
      {PANEL_GROUPS[panelKey].map((g) => (
        <div key={g.title}>
          <h3 className="mb-3 text-[13px] font-bold text-ink">{g.title}</h3>
          <ul className="space-y-2">
            {g.items.map((it) => (
              <li key={it.href + it.label}>
                <Link href={it.href} onClick={go} className="block text-[13.5px] text-n700 transition-colors hover:text-ember-deep hover:underline">{it.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function MegaMenuDesktop() {
  const pathname = usePathname();
  const [openKey, setOpenKey] = useState<Key | null>(null);
  const [shown, setShown] = useState(false);
  const [panelTop, setPanelTop] = useState(130);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const close = useCallback(() => { clearTimeout(closeTimer.current); setOpenKey(null); }, []);
  useEffect(() => { const r = requestAnimationFrame(() => setShown(openKey !== null)); return () => cancelAnimationFrame(r); }, [openKey]);
  useEffect(() => {
    if (!openKey) return;
    const measure = () => { const r = stripRef.current?.getBoundingClientRect(); if (r) setPanelTop(Math.round(r.bottom)); };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); };
  }, [openKey]);
  useEffect(() => { const r = requestAnimationFrame(() => close()); return () => cancelAnimationFrame(r); }, [pathname, close]);
  useEffect(() => {
    if (!openKey) return;
    const onDown = (e: PointerEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [openKey, close]);

  const hover = (key: Key) => { clearTimeout(closeTimer.current); setOpenKey(key); };
  const leaveNav = () => { closeTimer.current = setTimeout(() => setOpenKey(null), 140); };
  const go = () => close();
  const toggle = (key: Key) => setOpenKey((k) => (k === key ? null : key));

  const baseItem = "flex h-[50px] items-center gap-1.5 whitespace-nowrap px-3.5 text-sm font-medium transition-colors";
  const idle = "text-n800 hover:text-ink";
  const activeCls = "font-semibold text-ink shadow-[inset_0_-2px_0_var(--color-ember)]";

  const trigger = (key: Key) => (
    <button type="button" aria-haspopup="menu" aria-expanded={openKey === key} onClick={() => toggle(key)} onPointerEnter={() => hover(key)} className={baseItem + " " + (openKey === key ? activeCls : idle)}>
      {PANEL_LABEL[key]}
      <svg viewBox="0 0 24 24" aria-hidden className={"h-3.5 w-3.5 fill-none stroke-current transition-transform duration-150 " + (openKey === key ? "rotate-180" : "")} strokeWidth="2.2"><path d="M6 9l6 6 6-6" /></svg>
    </button>
  );

  return (
    <div ref={wrapRef} className="flex" onPointerLeave={leaveNav}>
      <div ref={stripRef} className="flex">
        {trigger("sports")}
        {trigger("institutions")}
        {trigger("how")}
        {trigger("support")}
      </div>
      {openKey && (
        <div className="pointer-events-none fixed inset-x-0 z-30" style={{ top: panelTop }}>
          <div className="mx-auto max-w-[1360px] px-4 md:px-10">
            <div className={"pointer-events-auto overflow-hidden rounded-b-[4px] border border-t-0 border-n200 bg-chalk shadow-overlay transition-all duration-150 ease-out " + (shown ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0")}>
              <TextGroupsPanel panelKey={openKey} go={go} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MegaMenuMobile({ onNavigate }: { onNavigate: () => void }) {
  const [openSlug, setOpenSlug] = useState<Key | null>("sports");
  const KEYS: Key[] = ["sports", "institutions", "how", "support"];

  return (
    <div>
      {KEYS.map((key) => {
        const expanded = openSlug === key;
        return (
          <div key={key} className="border-b border-white/10 last:border-b-0">
            <button type="button" aria-expanded={expanded} onClick={() => setOpenSlug(expanded ? null : key)} className="flex h-[52px] w-full items-center justify-between px-5 font-display text-base font-semibold text-white/85">
              {PANEL_LABEL[key]}
              <svg viewBox="0 0 24 24" aria-hidden className={"h-4 w-4 fill-none stroke-current transition-transform duration-150 " + (expanded ? "rotate-180" : "")} strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {expanded && (
              <div className="bg-ink2 px-5 pb-2">
                {PANEL_GROUPS[key].map((g) => (
                  <div key={g.title} className="py-2.5">
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-[.08em] text-white/45">{g.title}</div>
                    <ul>{g.items.map((it) => <li key={it.href + it.label}><Link href={it.href} onClick={onNavigate} className="flex h-9 items-center text-[15px] text-white/75 hover:text-white">{it.label}</Link></li>)}</ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

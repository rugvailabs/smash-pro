"use client";

import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/nav-catalogue";

/* ============================================================
   Shared dense multi-column TEXT mega-menu panel — same structural
   density across every nav tab (public and buyer), built from our
   own real categories/content. No competitor taxonomy or copy.
   ============================================================ */

export type NavGroup = { title: string; items: { label: string; href: string }[] };

const tile = (slug: string) => ({ label: CATEGORY_LABELS[slug] ?? slug, href: `/catalog?cat=${slug}` });

export const SPORT_GROUPS: NavGroup[] = [
  {
    title: "Quick Links",
    items: [
      { label: "Browse all categories", href: "/catalog?cat=cricket" },
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

export const INSTITUTIONS_GROUPS: NavGroup[] = [
  {
    title: "Buyer Types",
    items: [
      { label: "Schools & Colleges", href: "/register" },
      { label: "Sports Academies", href: "/register" },
      { label: "Retail Shops", href: "/register" },
      { label: "Institutional Buyers", href: "/register" },
    ],
  },
  {
    title: "Get Started",
    items: [
      { label: "Register your institution", href: "/register" },
      { label: "Sign in", href: "/signin" },
      { label: "Browse the catalogue", href: "/catalog?cat=cricket" },
    ],
  },
  {
    title: "Why Smash Pro",
    items: [
      { label: "How ordering works", href: "/#how" },
      { label: "Institutional pricing", href: "/#how" },
      { label: "One counterparty, always", href: "/#how" },
    ],
  },
];

export const HOW_GROUPS: NavGroup[] = [
  {
    title: "The Process",
    items: [
      { label: "Catalogue discovery", href: "/catalog?cat=cricket" },
      { label: "Organisation registration", href: "/register" },
      { label: "Account approval", href: "/#how" },
      { label: "Buyer-specific pricing", href: "/#how" },
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
      { label: "How it works, in full", href: "/#how" },
    ],
  },
];

export const SUPPLIER_GROUPS: NavGroup[] = [
  {
    title: "Get Started",
    items: [
      { label: "Become a supplier", href: "/register/supplier" },
      { label: "Supplier sign in", href: "/signin" },
    ],
  },
  {
    title: "Why Supply to Us",
    items: [
      { label: "Supply requirements", href: "/#supply" },
      { label: "Quotations", href: "/#supply" },
      { label: "Purchase orders", href: "/#supply" },
    ],
  },
];

const PANEL_COLS: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-3", 6: "grid-cols-6" };

export function TextGroupsPanel({ groups, go }: { groups: NavGroup[]; go: () => void }) {
  const cols = PANEL_COLS[groups.length] ?? "grid-cols-3";
  return (
    <div className={"grid gap-x-10 gap-y-2 p-7 " + cols}>
      {groups.map((g) => (
        <div key={g.title}>
          <h3 className="mb-3 text-[13px] font-bold text-ink">{g.title}</h3>
          <ul className="space-y-2">
            {g.items.map((it) => (
              <li key={it.href + it.label}>
                <Link href={it.href} data-panel-item onClick={go} className="block text-[13.5px] text-n700 transition-colors hover:text-ember-deep hover:underline">{it.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function TextGroupsMobile({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  return (
    <div className="px-5 py-2">
      {groups.map((g) => (
        <div key={g.title} className="py-2.5">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[.08em] text-white/45">{g.title}</div>
          <ul>{g.items.map((it) => (
            <li key={it.href + it.label}>
              <Link href={it.href} onClick={onNavigate} className="flex h-9 items-center text-[15px] text-white/75 hover:text-white">{it.label}</Link>
            </li>
          ))}</ul>
        </div>
      ))}
    </div>
  );
}

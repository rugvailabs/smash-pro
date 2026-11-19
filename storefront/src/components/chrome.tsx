"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCart, useIsClient, useRole, useWishlist } from "@/components/providers";
import { SearchBox } from "@/components/search-box";
import { MegaMenuDesktop, MegaMenuMobile } from "@/components/mega-menu";

/* ============================================================
   Storefront chrome — demo ribbon, header (logo, search, account/
   wishlist/cart icon-stack, nav row), mobile drawer, footer.
   Court Ink, Smash Pro branding only. "Signed in" is a labelled
   local demo toggle (ADR-0008) — never real authentication.
   ============================================================ */

export function DemoRibbon() {
  const { role, setRole } = useRole();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-n900 px-5 py-1.5 font-mono text-[11px] tracking-wide text-white/75 md:px-10">
      <b className="font-medium text-white">STOREFRONT PREVIEW</b>
      <span className="hidden sm:inline">frontend-only fixtures · no backend connected</span>
      <label className="ml-auto flex items-center gap-2">
        View as:
        <select
          aria-label="View as"
          className="rounded-[2px] border border-white/25 bg-ink2 px-1.5 py-0.5 font-mono text-[11px] text-white"
          value={role}
          onChange={(e) => setRole(e.target.value as "visitor" | "signed-in")}
        >
          <option value="visitor">Visitor</option>
          <option value="signed-in">Signed-in buyer (demo)</option>
        </select>
      </label>
    </div>
  );
}

function IconAction({ href, label, icon, badge, hideBelowSm = false }: { href: string; label: string; icon: React.ReactNode; badge?: React.ReactNode; hideBelowSm?: boolean }) {
  return (
    <Link href={href} className={(hideBelowSm ? "hidden sm:flex " : "flex ") + "flex-col items-center gap-1 text-n800 transition-colors hover:text-ink"}>
      <span className="relative flex h-6 w-6 items-center justify-center">{icon}{badge}</span>
      <span className="hidden text-[11px] font-medium leading-none sm:block">{label}</span>
    </Link>
  );
}

export function SiteHeader() {
  const { role } = useRole();
  const { count } = useCart();
  const { skus } = useWishlist();
  const mounted = useIsClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Light chrome — Smash Pro navy (Ink) wordmark/icons on white, Ember
          reserved for the accent/badges. Storefront-only token choice
          (ADR-0008); web/'s dark-ink header doctrine is unchanged there. */}
      <header className="sticky top-0 z-40 border-b border-n200 bg-chalk">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center gap-5 px-4 md:gap-7 md:px-10">
          <button onClick={() => setDrawerOpen(true)} aria-label="Open navigation" className="-ml-1 flex h-11 w-11 items-center justify-center text-ink md:hidden">
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-none stroke-current" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <Link href="/" className="stretch-xp shrink-0 font-display text-[22px] font-extrabold tracking-wide text-ink">SMASH PRO</Link>
          <SearchBox />
          <div className="ml-auto flex items-center gap-5 md:gap-6">
            <IconAction
              href="/account"
              label={role === "signed-in" ? "Account" : "Sign In"}
              icon={<svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.6"><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" /></svg>}
            />
            <IconAction
              hideBelowSm
              href="/account/orders"
              label="Orders"
              icon={<svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.6"><rect x="4" y="7" width="16" height="13" rx="1.5" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>}
            />
            <IconAction
              hideBelowSm
              href="/support"
              label="Support"
              icon={<svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1.8 1.8-2.3 3M12 16.5h.01" strokeLinecap="round" /></svg>}
            />
            <IconAction
              href="/wishlist"
              label="Wishlist"
              icon={<svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.6"><path d="M12 20.5l-7.1-7.1a4.5 4.5 0 0 1 6.4-6.4l.7.7.7-.7a4.5 4.5 0 0 1 6.4 6.4z" /></svg>}
              badge={mounted && skus.length > 0 ? (
                <span className="num absolute -right-2 -top-1.5 min-w-4 rounded-full bg-ember-deep px-1 text-center font-mono text-[10px] leading-[16px] text-white">{skus.length}</span>
              ) : undefined}
            />
            <IconAction
              href="/cart"
              label="Cart"
              icon={<svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.6"><path d="M4 5h2l1.5 10.5A2 2 0 0 0 9.5 17h7a2 2 0 0 0 2-1.6L20 8H6.5M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg>}
              badge={<span className="num absolute -right-2 -top-1.5 min-w-4 rounded-full bg-ember-deep px-1 text-center font-mono text-[10px] leading-[16px] text-white">{mounted ? count : 0}</span>}
            />
          </div>
        </div>
      </header>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <nav aria-label="Site sections" className="sticky top-20 z-30 hidden border-b border-n200 bg-chalk md:block">
        <div className="mx-auto flex max-w-[1280px] items-center gap-1 overflow-x-auto px-4 md:px-10">
          <MegaMenuDesktop />
          {mounted && role === "signed-in" && (
            <span className="ml-auto hidden items-center gap-1.5 text-[13px] text-n600 lg:inline-flex">
              Ordering as
              <Link href="/account" className="font-semibold text-ember-deep hover:underline">Demo Institution, Bengaluru</Link>
            </span>
          )}
        </div>
      </nav>
    </>
  );
}

function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role } = useRole();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Site navigation">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 left-0 flex w-[min(360px,88vw)] flex-col bg-ink">
        <div className="flex h-16 items-center justify-between px-5">
          <span className="stretch-xp font-display text-[19px] font-extrabold tracking-wide text-chalk">SMASH PRO</span>
          <button onClick={onClose} aria-label="Close navigation" className="flex h-11 w-11 items-center justify-center text-white">
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-none stroke-current" strokeWidth="2"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>
        <div className="px-5 pb-3"><SearchBox variant="drawer" onNavigate={onClose} /></div>
        <nav aria-label="Site sections" className="min-h-0 flex-1 overflow-y-auto">
          <MegaMenuMobile onNavigate={onClose} />
        </nav>
        <div className="border-t border-white/10 p-5">
          <div className="flex items-center gap-4">
            <Link href="/account" onClick={onClose} className="text-sm font-medium text-white">{role === "signed-in" ? "Account" : "Sign in"}</Link>
            <Link href="/register" onClick={onClose} className="inline-flex h-11 flex-1 items-center justify-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  const col = "mb-3.5 font-mono text-[11px] uppercase tracking-[.08em] text-white/45";
  const item = "text-sm text-white/75 hover:text-white hover:underline hover:underline-offset-[3px]";
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return (
    <footer className="mt-16 bg-ink text-white/70">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 pb-7 pt-11 sm:grid-cols-2 md:px-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] lg:gap-9 lg:pb-9 lg:pt-14">
        <div>
          <span className="stretch-xp font-display text-[22px] font-extrabold tracking-wide text-chalk">SMASH PRO</span>
          <p className="mt-3 max-w-[34ch] text-sm text-white/55">India&rsquo;s managed B2B platform for sports equipment — built for schools, academies, colleges and retailers.</p>
        </div>
        <div>
          <h5 className={col}>Shop</h5>
          <ul className="space-y-2">
            {[["Cricket", "cricket"], ["Badminton", "badminton"], ["Football", "football"], ["Gym & Fitness", "gym-fitness"]].map(([n, slug]) => (
              <li key={slug}><Link className={item} href={`/catalog/${slug}`}>{n}</Link></li>
            ))}
            <li><Link className={item} href="/catalog">All sports →</Link></li>
          </ul>
        </div>
        <div>
          <h5 className={col}>Institutional</h5>
          <ul className="space-y-2">
            <li><Link className={item} href="/#how">How it works</Link></li>
            <li><Link className={item} href="/register">Register as a buyer</Link></li>
            <li><Link className={item} href="/account">Your account</Link></li>
            <li><Link className={item} href="/wishlist">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <h5 className={col}>For Suppliers</h5>
          <ul className="space-y-2">
            <li><Link className={item} href="/register/supplier">Register as a supplier</Link></li>
            <li><Link className={item} href="/#how">Why supply to Smash Pro</Link></li>
          </ul>
        </div>
        <div>
          <h5 className={col}>Support</h5>
          <ul className="space-y-2">
            <li><Link className={item} href="/support">Help centre</Link></li>
            <li><Link className={item} href="/support/policies">Policies</Link></li>
            <li><Link className={item} href="/account/orders">Track an order</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-wrap gap-x-6 gap-y-1 px-4 py-4 font-mono text-[11px] text-white/40 md:px-10">
          <span>© 2026 SMASH PRO</span>
          <span>B2B SPORTS COMMERCE · INDIA</span>
          <Link href="/support/policies" className="hover:text-white/70">TERMS</Link>
          <Link href="/support/policies" className="hover:text-white/70">PRIVACY</Link>
          <span className="md:ml-auto">STOREFRONT PREVIEW · COURT INK · FIXTURE DATA</span>
        </div>
      </div>
    </footer>
  );
}

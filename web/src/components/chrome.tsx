"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart, useIsClient, useRole } from "@/components/providers";
import { SearchBox } from "@/components/search-box";
import { MegaMenuDesktop } from "@/components/mega-menu";
import { NavDrawer } from "@/components/nav-drawer";
import { NotificationBell } from "@/components/notification-bell";
import { PublicNavDesktop } from "@/components/public-nav";
import type { Role } from "@/lib/types";

/* ============================================================
   Site chrome: preview ribbon · unified header · role tab strip ·
   pending bar · footer · WhatsApp float. Court Ink, light only.
   ============================================================ */

const ROLE_LABELS: Record<Role, string> = {
  visitor: "Visitor",
  pending: "Registered buyer (pending)",
  buyer: "Approved buyer",
  supplier: "Supplier",
  admin: "Smash Pro admin",
};

export function PreviewRibbon() {
  const { role, setRole, email } = useRole();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-n900 px-5 py-1.5 font-mono text-[11px] tracking-wide text-white/75 md:px-10 print:hidden">
      <b className="font-medium text-white">DEMO</b>
      {/* compact one-liner on phones; full explainer from sm: up */}
      <span className="sm:hidden">sample data · illustrative prices</span>
      <span className="hidden sm:inline">sample data · illustrative prices · real accounts &amp; backend</span>
      <label className="flex items-center gap-2">
        Demo account:
        <select
          aria-label="Demo account"
          className="rounded-[2px] border border-white/25 bg-ink2 px-1.5 py-0.5 font-mono text-[11px] text-white"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </label>
      {email && <span className="hidden sm:inline">{email}</span>}
      <a className="underline-offset-2 hover:underline md:ml-auto" href="/img/LICENSES.md">
        image credits
      </a>
    </div>
  );
}

export function SiteHeader() {
  const { role: liveRole, orgName, signOut } = useRole();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Render the visitor-neutral header until hydrated: this component hydrates
  // inside a Suspense boundary, possibly after the stored role has loaded, so
  // the hydration pass must always match the server's visitor markup.
  const mounted = useIsClient();
  const role: Role = mounted ? liveRole : "visitor";

  /* Icon-over-label header action (premium retail chrome pattern) — one
     shared shape for Sign in / Account / Orders / Support / Wishlist /
     Cart so they read as a set. Light chrome: Ink icons/text on Chalk. */
  const IconAction = ({
    href, label, icon, badge, hiddenBelow = "md",
  }: { href: string; label: string; icon: React.ReactNode; badge?: React.ReactNode; hiddenBelow?: "md" | "lg" }) => (
    <Link
      href={href}
      className={
        "hidden flex-col items-center gap-1 text-n800 transition-colors hover:text-ink " +
        (hiddenBelow === "lg" ? "lg:flex" : "md:flex")
      }
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        {icon}
        {badge}
      </span>
      <span className="text-[11px] font-medium leading-none">{label}</span>
    </Link>
  );

  const wishlistIcon = (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.6"><path d="M12 20.5l-7.1-7.1a4.5 4.5 0 0 1 6.4-6.4l.7.7.7-.7a4.5 4.5 0 0 1 6.4 6.4z" /></svg>
  );
  const supportIcon = (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1.8 1.8-2.3 3M12 16.5h.01" strokeLinecap="round" /></svg>
  );
  const serviceIcon = (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.6"><path d="M14.7 6.3a4 4 0 0 1-5.4 5.1L4 16.7V20h3.3l5.3-5.3a4 4 0 0 1 5.1-5.4l-2.6 2.6-2-2z" strokeLinejoin="round" /></svg>
  );
  const ordersIcon = (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.6"><rect x="4" y="7" width="16" height="13" rx="1.5" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
  );

  const tab = (href: string, label: string, match: string) => (
    <Link
      key={match}
      href={href}
      className={
        "flex h-[50px] items-center whitespace-nowrap px-3.5 text-sm font-medium " +
        (pathname.startsWith(match)
          ? "font-semibold text-ink shadow-[inset_0_-2px_0_var(--color-ember)]"
          : "text-n800 hover:text-ink")
      }
    >
      {label}
    </Link>
  );

  return (
    <>
      {/* Light chrome — Smash Pro navy (Ink) wordmark/icons on white, Ember
          reserved for the accent/badges. */}
      <header className="sticky top-0 z-40 border-b border-n200 bg-chalk print:hidden">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center gap-5 px-4 md:gap-7 md:px-10">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="-ml-1 flex h-11 w-11 items-center justify-center text-ink md:hidden"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Link
            href="/"
            className="stretch-xp shrink-0 font-display text-[22px] font-extrabold tracking-wide text-ink"
          >
            SMASH PRO
          </Link>
          {/* Commerce search is buyer-side chrome — suppliers and the admin
              console work their own queues, never the sales catalogue. */}
          {role !== "supplier" && role !== "admin" && <SearchBox />}
          <div className="ml-auto flex items-center gap-5 md:gap-6">
            {role === "visitor" && (
              <IconAction
                href="/signin"
                label="Sign In"
                icon={
                  <svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.6">
                    <circle cx="12" cy="8" r="3.4" />
                    <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
                  </svg>
                }
              />
            )}
            {role === "visitor" && (
              <Link className="hidden h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press md:inline-flex" href="/register">
                Register
              </Link>
            )}
            {role === "buyer" && (
              <IconAction href="/orders" label="Orders" hiddenBelow="lg" icon={ordersIcon} />
            )}
            {/* Service, Support and Wishlist are buyer-commerce chrome — never supplier/admin. */}
            {role !== "supplier" && role !== "admin" && (
              <IconAction href="/service" label="Service" hiddenBelow="lg" icon={serviceIcon} />
            )}
            {role !== "supplier" && role !== "admin" && (
              <IconAction href="/support" label="Support" hiddenBelow="lg" icon={supportIcon} />
            )}
            {role !== "supplier" && role !== "admin" && (
              <IconAction href="/wishlist" label="Wishlist" icon={wishlistIcon} />
            )}
            {role !== "visitor" && (
              <span className="hidden items-center gap-2 border-l border-n200 pl-4 text-[13px] font-medium text-ink lg:inline-flex">
                {role === "admin"
                  ? "Smash Pro Operations"
                  : orgName ?? (role === "supplier" ? "Supplier account" : "Buyer account")}
                <span className="rounded-[2px] border border-n400 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-n600">
                  {role === "admin" ? "ADMIN" : role === "supplier" ? "SUPPLIER" : role === "buyer" ? "BUYER" : "UNDER REVIEW"}
                </span>
              </span>
            )}
            {/* In-app notification bell — every signed-in role */}
            {mounted && role !== "visitor" && <NotificationBell onInk={false} />}
            {role === "buyer" && (
              <IconAction
                href="/account"
                label="Account"
                hiddenBelow="lg"
                icon={
                  <svg viewBox="0 0 24 24" aria-hidden className="h-[20px] w-[20px] fill-none stroke-current" strokeWidth="1.6">
                    <circle cx="12" cy="8" r="3.4" />
                    <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
                  </svg>
                }
              />
            )}
            {role !== "visitor" && (
              <button
                onClick={() => void signOut().then(() => router.push("/"))}
                className="hidden text-[13px] font-medium text-n600 underline-offset-2 hover:text-ink hover:underline md:block"
              >
                Sign out
              </button>
            )}
            {/* The cart (and its badge) is buyer commerce — never supplier or admin chrome. */}
            {role !== "supplier" && role !== "admin" && (
              <Link
                href="/cart"
                aria-label="Cart"
                className="flex flex-col items-center gap-1 border-l border-n200 pl-4 text-n800 transition-colors hover:text-ink md:pl-5"
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <svg viewBox="0 0 24 24" aria-hidden className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.6">
                    <path d="M4 5h2l1.5 10.5A2 2 0 0 0 9.5 17h7a2 2 0 0 0 2-1.6L20 8H6.5M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                  </svg>
                  <span className="num absolute -right-2 -top-1.5 min-w-4 rounded-full bg-ember-deep px-1 text-center font-mono text-[10px] leading-[16px] text-white">
                    {mounted ? count : 0}
                  </span>
                </span>
                <span className="text-[11px] font-medium leading-none">Cart</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Tab strip is desktop/tablet navigation; the drawer owns phones. */}
      <nav aria-label="Site sections" className="sticky top-20 z-30 hidden border-b border-n200 bg-chalk md:block">
        <div className="mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-4 md:px-10">
          {/* public (visitor / pending) get the redesigned 5-item nav; logged-in
              roles keep their workspace nav below */}
          {role === "visitor" || role === "pending" ? (
            <PublicNavDesktop />
          ) : (
            <>
              {tab("/", role === "supplier" || role === "admin" ? "Home" : "Shop", "/__home")}
              {role === "buyer" && <MegaMenuDesktop key="catalogue" />}
            </>
          )}
          {role === "buyer" && (
            <>
              {tab("/dashboard", "Dashboard", "/dashboard")}
              {tab("/orders", "Orders", "/orders")}
              {tab("/payments", "Payments", "/payments")}
              {tab("/requests", "Requests", "/requests")}
              {tab("/account", "Account", "/account")}
            </>
          )}
          {role === "supplier" && (
            <>
              {tab("/supplier", "Supplier Workspace", "/supplier")}
              <span className="flex-1" />
              <Link href="/supplier/profile" className="flex h-[50px] items-center whitespace-nowrap px-3.5 text-sm font-medium text-n600 hover:text-ink">
                Eligibility &amp; profile
              </Link>
            </>
          )}
          {role === "admin" && tab("/admin", "Operations Console", "/admin")}
        </div>
      </nav>

      {role === "pending" && (
        <div className="border-b border-n200 bg-warn-t px-4 py-2 text-[13px] md:px-10">
          <b className="text-ink">Your registration is under review.</b>{" "}
          You&rsquo;re browsing at standard listed prices — institutional
          pricing and ordering activate on approval.
        </div>
      )}
    </>
  );
}

export function SiteFooter() {
  const { role } = useRole();
  const col = "mb-3.5 font-mono text-[11px] uppercase tracking-[.08em] text-white/45";
  const item = "text-sm text-white/75 hover:text-white hover:underline hover:underline-offset-[3px]";
  return (
    <footer className="mt-16 bg-ink text-white/70 print:hidden">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 pb-7 pt-11 sm:grid-cols-2 md:px-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] lg:gap-9 lg:pb-9 lg:pt-14">
        <div>
          <span className="stretch-xp font-display text-[22px] font-extrabold tracking-wide text-chalk">
            SMASH PRO
          </span>
          <p className="mt-3 max-w-[34ch] text-sm text-white/55">
            India&rsquo;s managed B2B platform for sports equipment — built for
            schools, academies, colleges and retailers.
          </p>
        </div>
        {role === "supplier" ? (
          /* Suppliers get their workspace sections here — the buyer
             catalogue links are commerce chrome and stay out of their way. */
          <div>
            <h5 className={col}>Workspace</h5>
            <ul className="space-y-2">
              <li><Link className={item} href="/supplier/requirements">Requirements</Link></li>
              <li><Link className={item} href="/supplier/quotes">Quotations</Link></li>
              <li><Link className={item} href="/supplier/pos">Purchase orders</Link></li>
              <li><Link className={item} href="/supplier/payments">Payments</Link></li>
            </ul>
          </div>
        ) : (
          <div>
            <h5 className={col}>Catalogue</h5>
            <ul className="space-y-2">
              {[["Cricket", "cricket"], ["Badminton", "badminton"], ["Basketball", "basketball"], ["Sportswear", "sportswear"]].map(([n, slug]) => (
                <li key={slug}><Link className={item} href={`/catalog?cat=${slug}`}>{n}</Link></li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h5 className={col}>Platform</h5>
          <ul className="space-y-2">
            <li><Link className={item} href="/#how">How it works</Link></li>
            {(role === "visitor" || role === "pending") && (
              <li><Link className={item} href="/register">Register as a buyer</Link></li>
            )}
            {role === "buyer" && (
              <li><Link className={item} href="/dashboard">Your dashboard</Link></li>
            )}
            {role !== "supplier" && (
              <li><Link className={item} href="/cart">Cart</Link></li>
            )}
          </ul>
        </div>
        <div>
          <h5 className={col}>For suppliers</h5>
          <ul className="space-y-2">
            <li><Link className={item} href="/#supply">Why supply to Smash Pro</Link></li>
            {(role === "visitor" || role === "pending") && (
              <li><Link className={item} href="/register/supplier">Register as a supplier</Link></li>
            )}
            {role === "supplier" && (
              <li><Link className={item} href="/supplier">Supplier Workspace</Link></li>
            )}
          </ul>
        </div>
        <div>
          <h5 className={col}>Support</h5>
          <ul className="space-y-2">
            <li>
              <a className={item} href="https://wa.me/910000000000" target="_blank" rel="noopener">
                WhatsApp the team
              </a>
            </li>
            <li><Link className={item} href="/#how">How ordering works</Link></li>
            {(role === "visitor" || role === "pending") && (
              <li><Link className={item} href="/signin">Sign in</Link></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-wrap gap-x-6 gap-y-1 px-4 py-4 font-mono text-[11px] text-white/40 md:px-10">
          <span>© 2026 SMASH PRO</span>
          <span>B2B SPORTS COMMERCE · INDIA</span>
          <span>TERMS</span>
          <span>PRIVACY</span>
          <span className="md:ml-auto">NEXT.JS PREVIEW · COURT INK v0.2 · ALL DATA ILLUSTRATIVE</span>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/910000000000"
      target="_blank"
      rel="noopener"
      aria-label="Chat with Smash Pro on WhatsApp (placeholder link — official number pending)"
      title="WhatsApp contact — placeholder link, official number pending"
      className="fixed bottom-5 right-5 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-ink shadow-overlay transition-colors hover:bg-ink2 print:hidden"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-white" strokeWidth="1.8">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-4.2 3.5c-.5.4-.8.2-.8-.4V5.5Z" />
        <path d="M8.5 8.5h7M8.5 11.5h4.5" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 rounded-[2px] bg-ember px-1 py-px font-mono text-[8px] tracking-wider text-white">
        WA
      </span>
    </a>
  );
}

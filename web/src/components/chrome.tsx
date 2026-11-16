"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart, useIsClient, useRole } from "@/components/providers";
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
};

export function PreviewRibbon() {
  const { role, setRole } = useRole();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-n900 px-5 py-1.5 font-mono text-[11px] tracking-wide text-white/75 md:px-10">
      <b className="font-medium text-white">DESIGN PREVIEW</b>
      <span>sample data · illustrative prices</span>
      <label className="flex items-center gap-2">
        Preview as:
        <select
          aria-label="Preview account state"
          className="rounded-[2px] border border-white/25 bg-ink2 px-1.5 py-0.5 font-mono text-[11px] text-white"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </label>
      <a className="underline-offset-2 hover:underline md:ml-auto" href="/img/LICENSES.md">
        image credits
      </a>
    </div>
  );
}

export function SiteHeader() {
  const { role: liveRole } = useRole();
  const { count } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  // Render the visitor-neutral header until hydrated: this component hydrates
  // inside a Suspense boundary, possibly after the stored role has loaded, so
  // the hydration pass must always match the server's visitor markup.
  const mounted = useIsClient();
  const role: Role = mounted ? liveRole : "visitor";

  const tab = (href: string, label: string, match: string) => (
    <Link
      key={match}
      href={href}
      className={
        "flex h-[46px] items-center whitespace-nowrap px-3.5 text-sm font-medium " +
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
      <header className="sticky top-0 z-40 bg-ink">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 md:gap-6 md:px-10">
          <Link
            href="/"
            className="font-display text-[19px] font-extrabold tracking-wide text-chalk"
            style={{ fontStretch: "112%" }}
          >
            PROSMASH
          </Link>
          {/* Commerce search is buyer-side chrome — suppliers work their own
              queue and never search the sales catalogue. */}
          {role !== "supplier" && (
            <form
              role="search"
              className="relative hidden max-w-[460px] flex-1 md:block"
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("q");
                router.push(`/search?q=${encodeURIComponent(String(q ?? ""))}`);
              }}
            >
              <input
                name="q"
                type="search"
                placeholder="Search equipment, categories…"
                aria-label="Search"
                className="h-10 w-full rounded-[2px] border border-white/25 bg-ink2 px-3 text-sm text-white placeholder:text-white/45"
              />
            </form>
          )}
          <div className="ml-auto flex items-center gap-4 md:gap-5">
            {(role === "visitor" || role === "pending") && (
              <a className="hidden text-sm font-medium text-white md:block" href="#" title="Sign-in arrives with account screens">
                Sign in
              </a>
            )}
            {role === "visitor" && (
              <a className="hidden h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white transition-colors hover:bg-ember-press md:inline-flex" href="#">
                Register
              </a>
            )}
            {role !== "visitor" && (
              <span className="hidden items-center gap-2 text-[13px] font-medium text-white lg:inline-flex">
                {role === "supplier" ? "Meerut Sports Works" : "St. Xavier's High School"}
                <span className="rounded-[2px] border border-white/25 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-white/55">
                  {role === "supplier" ? "SUPPLIER" : role === "buyer" ? "BUYER" : "UNDER REVIEW"}
                </span>
              </span>
            )}
            {/* The cart (and its badge) is buyer commerce — never supplier chrome. */}
            {role !== "supplier" && (
              <Link href="/cart" className="relative inline-flex items-center gap-2 text-sm font-medium text-white">
                Cart
                <span className="min-w-5 rounded-[2px] bg-ember-deep px-1.5 py-px text-center font-mono text-[11px]">
                  {mounted ? count : 0}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav aria-label="Site sections" className="sticky top-16 z-30 border-b border-n200 bg-chalk">
        <div className="mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-4 md:px-10">
          {tab("/", role === "supplier" ? "Home" : "Shop", "/__home")}
          {role !== "supplier" && tab("/catalog?cat=cricket", "Catalogue", "/catalog")}
          {(role === "visitor" || role === "pending") && (
            <>
              {tab("/#how", "How it works", "/#how")}
              {tab("/#supply", "For suppliers", "/#supply")}
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
              <Link href="/supplier/profile" className="flex h-[46px] items-center whitespace-nowrap px-3.5 text-sm font-medium text-n600 hover:text-ink">
                Eligibility &amp; profile
              </Link>
            </>
          )}
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
    <footer className="mt-16 bg-ink text-white/70">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 pb-7 pt-11 sm:grid-cols-2 md:px-10 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-11 lg:pb-9 lg:pt-14">
        <div>
          <span className="font-display text-[22px] font-extrabold tracking-wide text-chalk" style={{ fontStretch: "112%" }}>
            PROSMASH
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
              <li><a className={item} href="#">Register as a buyer</a></li>
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
            <li><Link className={item} href="/#supply">Why supply to ProSmash</Link></li>
            {(role === "visitor" || role === "pending") && (
              <li><a className={item} href="#">Register as a supplier</a></li>
            )}
            {role === "supplier" && (
              <li><Link className={item} href="/supplier">Supplier Workspace</Link></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-wrap gap-x-6 gap-y-1 px-4 py-4 font-mono text-[11px] text-white/40 md:px-10">
          <span>© 2026 PROSMASH</span>
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
      aria-label="Chat with ProSmash on WhatsApp (placeholder link — official number pending)"
      title="WhatsApp contact — placeholder link, official number pending"
      className="fixed bottom-5 right-5 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-ink shadow-overlay transition-colors hover:bg-ink2"
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

"use client";

import Link from "next/link";
import Image from "next/image";
import { Fragment, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRole } from "@/components/providers";
import { SearchBox } from "@/components/search-box";
import { MegaMenuMobile } from "@/components/mega-menu";
import { PublicNavMobile } from "@/components/public-nav";
import type { Role } from "@/lib/types";

/* ============================================================
   Mobile navigation drawer (library §1): full-height Ink panel —
   52px rows, display-weight labels, active item carries the 3px
   Ember bar; search at the top; sign-in + Register primary at the
   foot for visitors. Focus-trapped; closes on Esc and scrim tap.
   Role-scoped items mirror the desktop tab strip exactly.
   ============================================================ */

function itemsFor(role: Role): { href: string; label: string; match: string }[] {
  if (role === "admin") {
    return [
      { href: "/", label: "Home", match: "/__home" },
      { href: "/admin", label: "Operations Console", match: "/admin" },
    ];
  }
  if (role === "supplier") {
    return [
      { href: "/", label: "Home", match: "/__home" },
      { href: "/supplier", label: "Supplier Workspace", match: "/supplier" },
      { href: "/supplier/profile", label: "Eligibility & profile", match: "/supplier/profile" },
    ];
  }
  // Catalogue is the MegaMenuMobile accordion, injected after "Shop" in render.
  const base = [
    { href: "/", label: "Shop", match: "/__home" },
  ];
  if (role === "buyer") {
    return [
      ...base,
      { href: "/dashboard", label: "Dashboard", match: "/dashboard" },
      { href: "/orders", label: "Orders", match: "/orders" },
      { href: "/payments", label: "Payments", match: "/payments" },
      { href: "/requests", label: "Requests", match: "/requests" },
      { href: "/account", label: "Account", match: "/account" },
    ];
  }
  return [
    ...base,
    { href: "/#how", label: "How it works", match: "/#how" },
    { href: "/#supply", label: "For suppliers", match: "/#supply" },
  ];
}

export function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role, orgName, signOut } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc close + focus trap + body scroll lock
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLElement>("[data-drawer-close]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const items = itemsFor(role);
  const isOn = (match: string) =>
    match === "/__home" ? pathname === "/" : pathname.startsWith(match.split("?")[0].split("#")[0] || "/");

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Site navigation">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div ref={panelRef} className="absolute inset-y-0 left-0 flex w-[min(360px,88vw)] flex-col bg-ink">
        <div className="flex h-16 items-center justify-between px-5">
          <Image src="/img/brand/prosmash-logo-crest-color.png" alt="Smash Pro" width={92} height={102} className="h-10 w-auto" />
          <button
            data-drawer-close
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-11 w-11 items-center justify-center text-white"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>
        <div className="px-5 pb-3">
          <SearchBox variant="drawer" onNavigate={onClose} />
        </div>
        <nav aria-label="Site sections" className="min-h-0 flex-1 overflow-y-auto">
          {role === "visitor" || role === "pending" ? (
            /* public: the redesigned 5-group accordion nav */
            <PublicNavMobile onNavigate={onClose} />
          ) : (
            items.map((i) => (
              <Fragment key={i.label}>
                <Link
                  href={i.href}
                  onClick={onClose}
                  aria-current={isOn(i.match) ? "page" : undefined}
                  className={
                    "flex h-[52px] items-center px-5 font-display text-lg font-semibold " +
                    (isOn(i.match)
                      ? "bg-ink2 text-chalk shadow-[inset_3px_0_0_var(--color-ember)]"
                      : "text-white/80 hover:text-white")
                  }
                >
                  {i.label}
                </Link>
                {/* Catalogue accordion sits right after Shop — buyers only now */}
                {i.match === "/__home" && role === "buyer" && (
                  <MegaMenuMobile onNavigate={onClose} />
                )}
              </Fragment>
            ))
          )}
        </nav>
        <div className="border-t border-white/10 p-5">
          {role === "visitor" ? (
            <div className="flex items-center gap-4">
              <Link href="/signin" onClick={onClose} className="text-sm font-medium text-white">Sign in</Link>
              <Link href="/register" onClick={onClose} className="inline-flex h-11 flex-1 items-center justify-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white">
                Register
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1 text-[13px] font-medium text-white/80">
                <span className="block truncate">{orgName ?? "Your account"}</span>
                <span className="mt-1 inline-block rounded-[2px] border border-white/25 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-white/55">
                  {role === "admin" ? "ADMIN" : role === "supplier" ? "SUPPLIER" : role === "buyer" ? "BUYER" : "UNDER REVIEW"}
                </span>
              </div>
              <button
                onClick={() => { onClose(); void signOut().then(() => router.push("/")); }}
                className="shrink-0 text-sm font-medium text-white/80 underline-offset-2 hover:text-white hover:underline"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

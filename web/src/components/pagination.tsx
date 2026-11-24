"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/* ============================================================
   Catalogue grid pagination — URL-driven (?page=) so filters/sort
   stay intact across page changes, same pattern as catalog-toolbar
   and catalog-sidebar. Windowed page numbers (first/last + a run
   around the current page) so a category with hundreds of pages
   doesn't render hundreds of buttons.
   ============================================================ */

function pageWindow(page: number, totalPages: number): (number | "…")[] {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

const btn =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-[2px] border border-n400 px-2.5 text-[13px] font-medium transition-colors hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const goTo = useCallback(
    (p: number) => {
      const next = new URLSearchParams(params.toString());
      if (p <= 1) next.delete("page"); else next.set("page", String(p));
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      <button type="button" className={`${btn} text-ink`} disabled={page <= 1} onClick={() => goTo(page - 1)}>
        Prev
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-n400">…</span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => goTo(p)}
            className={`${btn} ${p === page ? "border-ink bg-ink text-chalk" : "text-ink"}`}
          >
            {p}
          </button>
        )
      )}
      <button type="button" className={`${btn} text-ink`} disabled={page >= totalPages} onClick={() => goTo(page + 1)}>
        Next
      </button>
    </nav>
  );
}

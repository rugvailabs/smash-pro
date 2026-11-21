"use client";

import { useMemo, useState } from "react";
import { AddToOrder, PriceBlock } from "@/components/product";
import type { Product } from "@/lib/types";

/* ============================================================
   ADR-0016 — Size/Colour picker for a grouped listing. `variants`
   is every ACTIVE sibling sharing the current product's groupKey
   (server/catalog.ts's getProductBySku attaches these, already
   fully role-aware-priced — no extra fetch on selection change).

   Resolves whichever (colour, size) combination the buyer picks to
   ONE specific variant Product, then renders the REAL price block
   and the existing AddToOrder control for THAT sku — add-to-cart,
   pricing and stock isolation are all unchanged, just pointed at
   whichever sku is currently selected.

   Scope note: switching the selection updates price/stock/add-to-
   cart but NOT the page's gallery/name/specs above this component
   (those stay bound to the SKU the page was loaded with) — a
   deliberate v1 simplification, not an oversight.
   ============================================================ */

export function VariantPicker({ initialSku, variants }: { initialSku: string; variants: Product[] }) {
  const initial = variants.find((v) => v.sku === initialSku) ?? variants[0];

  const colors = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color).filter((c): c is string => Boolean(c)))),
    [variants]
  );
  const sizes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s)))),
    [variants]
  );

  const [selColor, setSelColor] = useState<string | null>(initial?.color ?? null);
  const [selSize, setSelSize] = useState<string | null>(initial?.size ?? null);

  const match =
    variants.find(
      (v) => (colors.length === 0 || v.color === selColor) && (sizes.length === 0 || v.size === selSize)
    ) ?? null;

  const colorAvailable = (c: string) =>
    variants.some((v) => v.color === c && (sizes.length === 0 || v.size === selSize));
  const sizeAvailable = (s: string) =>
    variants.some((v) => v.size === s && (colors.length === 0 || v.color === selColor));

  return (
    <div>
      {colors.length > 0 && (
        <div className="mb-3.5">
          <div className="mb-1.5 text-[13px] font-medium text-ink">Colour</div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Colour">
            {colors.map((c) => {
              const selected = selColor === c;
              const available = colorAvailable(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={selected}
                  disabled={!available}
                  onClick={() => setSelColor(c)}
                  className={
                    "rounded-[2px] border bg-chalk px-3.5 py-2 text-left text-sm transition-colors " +
                    (!available
                      ? "cursor-not-allowed border-n200 text-n400 line-through"
                      : selected
                      ? "border-ember-deep font-semibold shadow-[inset_0_0_0_1px_var(--color-ember-deep)]"
                      : "border-n400 hover:border-ink")
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="mb-3.5">
          <div className="mb-1.5 text-[13px] font-medium text-ink">Size</div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
            {sizes.map((s) => {
              const selected = selSize === s;
              const available = sizeAvailable(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={selected}
                  disabled={!available}
                  onClick={() => setSelSize(s)}
                  className={
                    "rounded-[2px] border bg-chalk px-3.5 py-2 text-left text-sm transition-colors " +
                    (!available
                      ? "cursor-not-allowed border-n200 text-n400 line-through"
                      : selected
                      ? "border-ember-deep font-semibold shadow-[inset_0_0_0_1px_var(--color-ember-deep)]"
                      : "border-n400 hover:border-ink")
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!match ? (
        <p className="mb-3.5 text-[13px] font-medium text-warn">This combination isn&apos;t available.</p>
      ) : match.inStock === false ? (
        <div className="mb-3.5">
          <PriceBlock p={match} size="detail" />
          <p className="mt-2 text-[13px] font-medium text-warn">Out of stock — not orderable right now.</p>
        </div>
      ) : (
        <div className="mb-3.5">
          <PriceBlock p={match} size="detail" />
        </div>
      )}

      {match && match.inStock !== false && <AddToOrder p={match} />}
    </div>
  );
}

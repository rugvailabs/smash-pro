"use client";

import { useState } from "react";
import { RACQUET_OPTIONS } from "@/data/products";
import { useCart, useRole } from "@/components/providers";
import { useToast } from "@/components/toast";
import { inr } from "@/lib/format";
import type { Product } from "@/lib/types";

/* ============================================================
   Badminton racquet configurator — stringing, tension and grip
   are MANDATORY before add-to-order (owner-directed feature).
   Option pricing is ILLUSTRATIVE, pending approval; the
   product-options capability is a new requirement to document.
   ============================================================ */

type GroupKey = "string" | "tension" | "grip";
const GROUP_LABELS: Record<GroupKey, string> = {
  string: "Stringing",
  tension: "String tension",
  grip: "Grip size",
};
const MISSING_NAMES: Record<GroupKey, string> = {
  string: "stringing",
  tension: "tension",
  grip: "grip",
};

export function RacquetConfigurator({ p }: { p: Product }) {
  const { role } = useRole();
  const { add } = useCart();
  const { toast } = useToast();
  const [sel, setSel] = useState<Record<GroupKey, string | null>>({
    string: null, tension: null, grip: null,
  });
  const [qty, setQty] = useState(6);

  const delta = RACQUET_OPTIONS.string.find((o) => o.value === sel.string)?.delta ?? 0;
  const complete = Boolean(sel.string && sel.tension && sel.grip);
  const missing = (Object.keys(MISSING_NAMES) as GroupKey[])
    .filter((k) => !sel[k])
    .map((k) => MISSING_NAMES[k]);

  return (
    <div>
      <div className="mb-4 rounded-[2px] border border-n200 bg-chalk p-4.5">
        <div className="font-display text-base font-semibold text-ink">Configure your racquets</div>
        <div className="mb-3.5 text-[13px] text-n600">
          Racquets ship strung and gripped — stringing, tension and grip are
          required before ordering.
        </div>

        {(Object.keys(GROUP_LABELS) as GroupKey[]).map((g) => (
          <div key={g} className="mb-3.5 last:mb-0">
            <div className="mb-1.5 text-[13px] font-medium text-ink">
              {GROUP_LABELS[g]}
              <span className="ml-1.5 font-mono text-[10px] tracking-wide text-ember-deep">required</span>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={GROUP_LABELS[g]}>
              {RACQUET_OPTIONS[g].map((o) => {
                const selected = sel[g] === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSel({ ...sel, [g]: o.value })}
                    className={
                      "rounded-[2px] border bg-chalk px-3.5 py-2 text-left text-sm transition-colors " +
                      (selected
                        ? "border-ember-deep font-semibold shadow-[inset_0_0_0_1px_var(--color-ember-deep)]"
                        : "border-n400 hover:border-ink")
                    }
                  >
                    {o.value}
                    <small className="block text-[11px] font-normal text-n600">{o.note}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-3.5 border-t border-n200 pt-3 text-[13px] text-n600">
          {complete ? (
            <>
              <b className="text-ink">Your build:</b> {sel.string} · {sel.tension} · Grip {sel.grip}
              {delta > 0 && (
                <> · option + {inr(delta)}{" "}
                  <span className="font-mono text-[10px] uppercase text-n400">illustrative</span>
                </>
              )}
            </>
          ) : (
            <span className="font-medium text-warn">Still needed: {missing.join(", ")}.</span>
          )}
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-n400">
          option pricing illustrative — pending owner approval ·
          product-options capability is a new requirement to document
        </p>
      </div>

      <div className="mb-2.5 flex flex-wrap gap-3">
        {role === "buyer" ? (
          <>
            <span className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk">
              <button aria-label="Decrease" className="h-full w-10 text-[17px]" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="num min-w-[52px] text-center font-semibold">{qty}</span>
              <button aria-label="Increase" className="h-full w-10 text-[17px]" onClick={() => setQty(qty + 1)}>+</button>
            </span>
            <button
              disabled={!complete}
              aria-disabled={!complete}
              onClick={() => {
                if (!complete) return;
                add(p.sku, qty, { string: sel.string!, tension: sel.tension!, grip: sel.grip! }, delta);
                toast(`Added — ${qty} racquets, ${sel.string} @ ${sel.tension}, grip ${sel.grip}.`);
              }}
              className={
                "inline-flex h-11 items-center rounded-[2px] px-5 text-sm font-semibold transition-colors " +
                (complete
                  ? "bg-ember-deep text-white hover:bg-ember-press"
                  : "cursor-not-allowed bg-n200 text-n400")
              }
            >
              Add to order
            </button>
          </>
        ) : (
          <a className="inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press" href="#">
            Register to order
          </a>
        )}
      </div>
    </div>
  );
}

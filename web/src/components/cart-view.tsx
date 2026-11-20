"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, useRole } from "@/components/providers";
import { useToast } from "@/components/toast";
import { EmptyState } from "@/components/empty-state";
import { inr } from "@/lib/format";

/* Cart over the SERVER cart (integration point I3): lines arrive priced by
   the backend for the signed-in buyer — the client never computes prices.
   Ordering requires an approved buyer account (OBD-08); visitors see the
   empty state with the register path. */

export function CartView() {
  const { role } = useRole();
  const { lines, setQty, remove, summary } = useCart();
  const { toast } = useToast();

  if (!lines.length) {
    return (
      <div className="mt-6">
        <EmptyState
          message="Your order is empty."
          hint={
            role === "buyer"
              ? "Items you add from the catalogue appear here."
              : "Sign in with an approved buyer account to build an order."
          }
          actionLabel="Browse the catalogue"
          actionHref="/catalog?cat=cricket"
        />
      </div>
    );
  }

  return (
    <div className="mt-6 grid items-start gap-7 pb-20 lg:grid-cols-[7fr_5fr] lg:pb-0">
      <div className="border border-n200 bg-chalk">
        {lines.map((l) => (
          <div key={l.key} className="flex flex-wrap items-center gap-3.5 border-b border-n100 p-4 last:border-b-0">
            <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden bg-n100">
              {l.img ? (
                <Image src={l.img} alt="" fill sizes="72px" className="object-cover" />
              ) : (
                /* Library §4 placeholder hatch — no substitute imagery. */
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)",
                  }}
                />
              )}
            </div>
            <div className="min-w-[190px] flex-1">
              <div className="text-sm font-semibold text-ink">{l.name}</div>
              <div className="font-mono text-xs text-n600">SKU {l.sku}</div>
              {l.config && (
                <div className="mt-0.5 text-[12.5px] text-n600">
                  String: {l.config.string} · Tension: {l.config.tension} · Grip: {l.config.grip}
                  {l.delta > 0 && (
                    <> · option +{inr(l.delta)}{" "}
                      <span className="font-mono text-[10px] uppercase text-n400">illustrative, pending</span>
                    </>
                  )}
                </div>
              )}
              <div className="num mt-0.5 text-[13px] text-n600">{inr(l.unit)} / unit · incl. GST</div>
            </div>
            <span className="inline-flex h-9 items-center rounded-[2px] border border-n400 bg-chalk">
              <button aria-label="Decrease" className="h-full w-8"
                onClick={() => setQty(l.key, Math.max(1, l.qty - 1)).catch(() => toast("Couldn't update the quantity — please try again."))}>−</button>
              <span className="num min-w-[44px] text-center text-sm font-semibold">{l.qty}</span>
              <button aria-label="Increase" className="h-full w-8"
                onClick={() => setQty(l.key, Math.min(9999, l.qty + 1)).catch(() => toast("Couldn't update the quantity — please try again."))}>+</button>
            </span>
            <div className="num w-full text-right text-[15px] font-semibold text-ink sm:w-auto">{inr(l.total)}</div>
            <button
              className="text-[13px] font-medium text-ember-deep hover:underline"
              onClick={() => {
                remove(l.key)
                  .then(() => toast(`Removed ${l.name.split(" — ")[0]} from your order.`))
                  .catch(() => toast("Couldn't remove the item — please try again."));
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="lg:sticky lg:top-[132px]">
        <div className="border border-n200 bg-chalk p-5">
          <div className="flex justify-between py-1.5 text-sm">
            <span>Items (incl. GST)</span>
            <span className="num">{inr(summary.itemsIncl)}</span>
          </div>
          <div className="pb-1.5 text-xs text-n600">
            {summary.freeDeliveryEligible
              ? "You're eligible for free Smash Pro delivery — choose it at checkout."
              : "Full GST breakdown and delivery options appear at checkout."}
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-n400 pt-3.5">
            <b className="text-[15px] text-ink">Order value so far</b>
            <span className="num font-display text-[21px] font-bold text-ink">{inr(summary.itemsIncl)}</span>
          </div>
        </div>
        {/* desktop action — the sticky bar carries it below lg (one primary per view) */}
        <Link
          href="/checkout"
          className="mt-3.5 hidden h-11 w-full items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press lg:inline-flex"
        >
          Proceed to checkout
        </Link>
        <Link href="/catalog?cat=cricket" className="mt-2.5 inline-flex h-11 w-full items-center justify-center rounded-[2px] border border-n400 bg-chalk px-5 text-sm font-semibold text-ink hover:border-ink">
          Continue browsing
        </Link>
        <div className="mt-3.5 border-l-[3px] border-info bg-info-t px-4 py-3 text-sm">
          <b className="text-ink">100% advance payment.</b> Orders dispatch
          after full payment is confirmed — ordering requires an approved buyer
          account.
        </div>
      </div>

      {/* sticky mobile summary bar — the primary action stays reachable
          without scrolling back (DESIGN-STANDARDS §4); right inset clears
          the WhatsApp float */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-n200 bg-chalk shadow-raised lg:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 py-2.5 pl-4 pr-20">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-wide text-n600">Order value</div>
            <div className="num font-display text-[17px] font-bold leading-tight text-ink">{inr(summary.itemsIncl)}</div>
          </div>
          <Link href="/checkout" className="inline-flex h-11 shrink-0 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white">
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}

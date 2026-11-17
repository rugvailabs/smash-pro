import { inr } from "@/lib/format";
import type { RailStep } from "@/lib/types";

/* ============================================================
   Shared buyer-workspace primitives (Court Ink, library §§ chips /
   panels / GST block / status rail). Presentational — no hooks.
   ============================================================ */

export type ChipTone = "ok" | "warn" | "bad" | "info" | "neu";

const CHIP_TONES: Record<ChipTone, string> = {
  ok: "bg-ok-t text-ok",
  warn: "bg-warn-t text-warn",
  bad: "bg-bad-t text-bad",
  info: "bg-info-t text-info",
  neu: "bg-n100 text-n600",
};

export function Chip({ tone, children }: { tone: ChipTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-[2px] px-2 text-xs font-medium ${CHIP_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Sect({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="mb-2.5 mt-8 font-mono text-[11px] uppercase tracking-[.08em] text-n600 first:mt-0">
      {children}
    </div>
  );
}

export function NoteFlag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[10px] uppercase tracking-wide text-n400 ${className}`}>{children}</p>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[2px] border border-n200 bg-chalk ${className}`}>{children}</div>;
}

export function PanelHead({ title, aside }: { title: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 border-b border-n200 px-4 py-3.5">
      <b className="font-display text-base font-semibold text-ink">{title}</b>
      {aside && <span className="ml-auto">{aside}</span>}
    </div>
  );
}

/** Key-value row — no-clip rule (DESIGN-STANDARDS §4): the value may wrap
 *  onto its own full-width line but must never overflow the container,
 *  whatever length production data has. */
export function KV({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-1.5 text-sm">
      <span className="text-n600">{k}</span>
      <span className="min-w-0 max-w-full break-words text-right text-ink">{children}</span>
    </div>
  );
}

export function Banner({
  tone = "info", children, className = "",
}: { tone?: "info" | "warn" | "ok" | "bad"; children: React.ReactNode; className?: string }) {
  const tones = {
    info: "border-info bg-info-t",
    warn: "border-warn bg-warn-t",
    ok: "border-ok bg-ok-t",
    bad: "border-bad bg-bad-t",
  };
  return (
    <div className={`rounded-[2px] border-l-[3px] px-4 py-3 text-sm ${tones[tone]} ${className}`}>
      {children}
    </div>
  );
}

/** GST presentation block — amounts illustrative; rates per product HSN
 *  pending tax confirmation (OBD-20 / OBD-11). */
export function GstCard({
  subtotal, gst, shipping, total, totalLabel = "Total payable (incl. GST)",
}: { subtotal: number; gst: number; shipping: number | null; total: number; totalLabel?: string }) {
  return (
    <Panel className="p-4">
      <div className="flex justify-between py-1 text-sm">
        <span>Items subtotal <span className="text-n600">(ex-GST)</span></span>
        <span className="num">{inr(subtotal)}</span>
      </div>
      <div className="flex justify-between py-1 text-sm">
        <span>GST</span><span className="num">{inr(gst)}</span>
      </div>
      <div className="pb-1 text-xs text-n600">Rates per product HSN — pending tax confirmation</div>
      <div className="flex justify-between py-1 text-sm">
        <span>Shipping</span>
        <span className="num">{shipping === null ? "—" : inr(shipping)}</span>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between border-t border-n400 pt-3">
        <b className="text-[15px] text-ink">{totalLabel}</b>
        <span className="num font-display text-[21px] font-bold text-ink">{inr(total)}</span>
      </div>
    </Panel>
  );
}

/** Multi-step flow rail (library §8): numbered steps in mono — check for
 *  done, Ember Deep numeral for the current step, muted for upcoming.
 *  Used across the cart → checkout → payment purchase flow. */
export function FlowRail({ steps, current, label = "Checkout progress" }: { steps: string[]; current: number; label?: string }) {
  const items: React.ReactNode[] = [];
  steps.forEach((s, i) => {
    if (i > 0) items.push(<span key={`rule-${i}`} aria-hidden className="h-px w-5 shrink-0 bg-n200 sm:w-8" />);
    const state = i < current ? "done" : i === current ? "cur" : "next";
    items.push(
      <span
        key={s}
        aria-current={state === "cur" ? "step" : undefined}
        className={
          "flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] " +
          (state === "cur" ? "font-semibold text-ink" : state === "done" ? "text-n600" : "text-n400")
        }
      >
        <span className={"num font-mono text-[11px] " + (state === "cur" ? "text-ember-deep" : state === "done" ? "text-ok" : "text-n400")}>
          {state === "done" ? "✓" : String(i + 1).padStart(2, "0")}
        </span>
        {s}
      </span>
    );
  });
  return <nav aria-label={label} className="mb-5 flex items-center gap-2 overflow-x-auto sm:gap-3">{items}</nav>;
}

/** Horizontal order-progress rail (library status-rail pattern). */
export function Rail({ steps }: { steps: RailStep[] }) {
  return (
    <div className="flex overflow-x-auto rounded-[2px] border border-n200 bg-chalk">
      {steps.map((s) => (
        <div
          key={s.label}
          className={
            "min-w-[120px] flex-1 border-r border-n200 px-3.5 py-3 text-[13px] font-medium last:border-r-0 " +
            (s.state === "done"
              ? "text-ink"
              : s.state === "cur"
              ? "bg-warn-t text-ink shadow-[inset_0_-2px_0_var(--color-ember)]"
              : "text-n400")
          }
        >
          {s.state === "done" && <span className="mr-1.5 text-ok">✓</span>}
          {s.label}
          <span className="num mt-0.5 block font-mono text-[10px] uppercase text-n600">{s.date ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}

/** titleAside renders badges/chips visually beside the heading but OUTSIDE
 *  the h1, so the accessible page name stays clean (never "PO-…Warehouse"). */
export function PageHead({
  title, titleAside, sub, actions, crumb,
}: { title: React.ReactNode; titleAside?: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode; crumb?: React.ReactNode }) {
  return (
    <>
      {crumb && <div className="mb-1 text-[13px] text-n600">{crumb}</div>}
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[28px]">{title}</h1>
            {titleAside}
          </div>
          {sub && <div className="mt-1 text-sm text-n600">{sub}</div>}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
      {/* page-header rule: the screen's single 16° brand motif */}
      <div className="rule-16 mb-6" aria-hidden />
    </>
  );
}

export function DocRow({
  file, meta, action,
}: { file: string; meta?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3 text-sm last:border-b-0">
      <span className="font-mono text-[12.5px] text-ink">{file}</span>
      {meta && <span className="text-xs text-n600">{meta}</span>}
      {action && <span className="ml-auto">{action}</span>}
    </div>
  );
}

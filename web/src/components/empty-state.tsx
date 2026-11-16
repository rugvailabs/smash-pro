import Link from "next/link";

/* ============================================================
   Empty state (library §14): illustration slot · one-sentence
   reason · one action. The illustration is a LABELLED placeholder
   frame (16° hatch, mono caption) until the line-illustration set
   is commissioned (VISUAL-IDENTITY §5) — never a fake drawing.
   ============================================================ */

export function EmptyState({
  message, hint, actionLabel, actionHref,
}: {
  message: React.ReactNode;
  hint?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-[2px] border border-n200 bg-chalk px-6 py-10 text-center">
      <div
        aria-hidden
        className="mx-auto mb-5 flex h-20 w-28 items-end justify-center rounded-[2px] border border-n200 bg-n100 pb-1.5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)",
        }}
      >
        <span className="bg-n100 px-1 font-mono text-[9px] uppercase tracking-wide text-n400">
          illustration pending
        </span>
      </div>
      <p className="text-[15px] text-ink">{message}</p>
      {hint && <p className="mt-1 text-sm text-n600">{hint}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

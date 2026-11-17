import type { ChipTone } from "@/components/buyer-ui";

/* ============================================================
   Super Admin shared primitives (B5) — dense control aesthetic
   per PORTAL-PRINCIPLES §5: hairline tables, sticky headers,
   mono micro-labels, Ember rationed to the advancing action.
   NO 16° diagonal anywhere in the admin surface — AdminHead uses
   a straight hairline rule, never `rule-16`.
   No hooks — importable from server and client components.
   ============================================================ */

/** The 12 approved commerce categories (slug + display label). */
export const ADMIN_CATEGORIES: { slug: string; label: string }[] = [
  { slug: "cricket", label: "Cricket" },
  { slug: "football", label: "Football" },
  { slug: "basketball", label: "Basketball" },
  { slug: "volleyball", label: "Volleyball" },
  { slug: "badminton", label: "Badminton" },
  { slug: "tennis", label: "Tennis" },
  { slug: "athletics", label: "Athletics" },
  { slug: "gym-fitness", label: "Gym & Fitness" },
  { slug: "indoor-games", label: "Indoor Games" },
  { slug: "outdoor-games", label: "Outdoor Games" },
  { slug: "sportswear", label: "Sportswear" },
  { slug: "accessories", label: "Accessories" },
];

export function catLabel(slug: string): string {
  return ADMIN_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

/** Heuristic chip tone for lifecycle strings whose exact vocabulary lives
 *  server-side (order/payment/requirement/quote statuses are `string` in the
 *  contract). Known enums (complaints, product requests, PO fulfilment, org
 *  status) also resolve correctly through this map. */
export function statusTone(s: string): ChipTone {
  const k = s.toLowerCase();
  if (/reject|declin|cancel|fail|suspend|withdraw|overdue/.test(k)) return "bad";
  if (/await|pending|review|open|revis|proof|verif(y|ication)/.test(k)) return "warn";
  if (/deliver|confirm|complete|resolv|award|active|available|closed|paid|verified|received|dispatch|acknowledg|publish/.test(k)) return "ok";
  return "neu";
}

/* ---------- micro-tags ---------- */

export function DestTag({ direct }: { direct: boolean }) {
  return (
    <span
      className={
        "inline-flex h-6 items-center whitespace-nowrap rounded-[2px] border px-2 font-mono text-[10px] uppercase tracking-wide " +
        (direct ? "border-ember-deep text-ember-deep" : "border-n400 text-n600")
      }
    >
      {direct ? "Direct" : "Warehouse"}
    </span>
  );
}

export function KindTag({ kind }: { kind: "buyer" | "supplier" }) {
  return (
    <span
      className={
        "inline-flex h-6 items-center whitespace-nowrap rounded-[2px] border px-2 font-mono text-[10px] uppercase tracking-wide " +
        (kind === "supplier" ? "border-ink text-ink" : "border-n400 text-n600")
      }
    >
      {kind}
    </span>
  );
}

/* ---------- page head (admin variant — straight rule, no 16°) ---------- */

export function AdminHead({
  title, titleAside, sub, actions, crumb,
}: {
  title: React.ReactNode;
  titleAside?: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  crumb?: React.ReactNode;
}) {
  return (
    <>
      {crumb && <div className="mb-1 text-[13px] text-n600">{crumb}</div>}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[26px]">{title}</h1>
            {titleAside}
          </div>
          {sub && <div className="mt-1 text-sm text-n600">{sub}</div>}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
      {/* admin surfaces carry no 16° motif (PORTAL-PRINCIPLES §5) */}
      <div className="mb-6 border-b border-n200" aria-hidden />
    </>
  );
}

/* ---------- dense table scaffold ---------- */

export const thCls =
  "sticky top-0 z-[1] whitespace-nowrap border-b border-n200 bg-chalk px-3.5 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[.07em] text-n600";
export const tdCls = "px-3.5 py-2.5 align-middle";
export const trCls = "border-b border-n100 last:border-b-0 hover:bg-paper";

/** Hairline table with sticky mono header. `mobile`:
 *  - "scroll": always rendered; scrolls inside its own container on phones
 *  - "hidden": desktop only — caller supplies a card fallback for mobile  */
export function AdminTable({
  cols, minW = 760, mobile = "scroll", maxH, children,
}: {
  cols: { h: string; right?: boolean }[];
  minW?: number;
  mobile?: "scroll" | "hidden";
  /** vertical cap (px) — turns the sticky header on for long queues */
  maxH?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "overflow-x-auto rounded-[2px] border border-n200 bg-chalk " +
        (mobile === "hidden" ? "hidden md:block " : "") +
        (maxH ? "overflow-y-auto" : "")
      }
      style={maxH ? { maxHeight: maxH } : undefined}
    >
      <table className="w-full border-collapse text-sm" style={{ minWidth: minW }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.h} className={`${thCls} ${c.right ? "text-right" : ""}`}>{c.h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* ---------- shared control classes ---------- */

export const btnEmber =
  "inline-flex h-10 items-center justify-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white transition-colors hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400";
export const btnEmberSm =
  "inline-flex h-8 items-center justify-center rounded-[2px] bg-ember-deep px-3 text-[13px] font-semibold text-white transition-colors hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400";
export const btnGhost =
  "inline-flex h-10 items-center justify-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink disabled:cursor-not-allowed disabled:border-n200 disabled:text-n400";
export const btnGhostSm =
  "inline-flex h-8 items-center justify-center rounded-[2px] border border-n400 bg-chalk px-3 text-[13px] font-semibold text-ink hover:border-ink disabled:cursor-not-allowed disabled:border-n200 disabled:text-n400";
export const inputCls =
  "h-10 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink placeholder:text-n400";
export const labelCls = "mb-1.5 block text-[13px] font-medium text-ink";

/** CSV export link — a plain download anchor to a server export route (NOT a
 *  page, so Next's Link is wrong here; the rule is disabled intentionally). */
export function ExportCsvLink({ kind, label = "Export CSV" }: { kind: string; label?: string }) {
  return (
    <a href={`/api/admin/export/${kind}`} className={btnGhost} download>
      {label}
    </a>
  );
}

/** Audit reassurance line — rendered wherever mutations happen. */
export function AuditNote({ className = "mt-2.5" }: { className?: string }) {
  return (
    <p className={`font-mono text-[10px] uppercase tracking-wide text-n400 ${className}`}>
      every action here is recorded with operator + timestamp — audit log plt-003
    </p>
  );
}

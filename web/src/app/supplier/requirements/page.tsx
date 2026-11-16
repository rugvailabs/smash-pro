import Link from "next/link";
import type { Metadata } from "next";
import { Chip, NoteFlag, PageHead, Panel, Sect } from "@/components/buyer-ui";
import { getRequirements, getSupplierProfile } from "@/lib/supplier-api";
import type { SupplierRequirement } from "@/lib/types";

/* Matched procurement requirements — SUP-005 / Workflow D. ONLY requirements
   matching this supplier's approved categories; requirement origins are
   never shown. */

export const metadata: Metadata = { title: "Procurement requirements" };

function Row({ r }: { r: SupplierRequirement }) {
  const tone = r.status === "open" ? "info" : r.status === "quoted-revision" ? "warn" : r.status === "awarded" ? "ok" : "neu";
  const action =
    r.status === "open" ? { href: `/supplier/requirements/${r.id}`, label: "Review & quote", pri: true }
    : r.status === "quoted-revision" ? { href: `/supplier/quotes/${r.id}`, label: "Open quotation", pri: false }
    : r.status === "awarded" && r.poId ? { href: `/supplier/pos/${r.poId}`, label: "View PO", pri: false }
    : null;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3.5 last:border-b-0">
      <span className="font-mono text-[12.5px] text-ink">{r.id}</span>
      <div className="min-w-[220px] flex-1">
        <div className="text-sm font-medium text-ink">{r.title}</div>
        <div className="text-[13px] text-n600">{r.category} · qty {r.qty} · deliver to {r.destination}</div>
      </div>
      {(r.status === "open" || r.status === "quoted-revision") && (
        <span className={`font-mono text-[11px] ${r.closesToday ? "font-medium text-warn" : "text-n600"}`}>
          closes {r.closes}
        </span>
      )}
      <Chip tone={tone}>{r.statusLabel}</Chip>
      {action && (
        <Link
          href={action.href}
          className={
            "inline-flex h-8 items-center rounded-[2px] px-3 text-[13px] font-semibold " +
            (action.pri ? "bg-ember-deep text-white hover:bg-ember-press" : "border border-n400 bg-chalk text-ink hover:border-ink")
          }
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export default async function RequirementsPage() {
  const [reqs, profile] = await Promise.all([getRequirements(), getSupplierProfile()]);
  const open = reqs.filter((r) => r.status === "open" || r.status === "quoted-revision");
  const closed = reqs.filter((r) => r.status === "awarded" || r.status === "closed");

  return (
    <main>
      <PageHead
        title="Procurement requirements"
        sub={`Matched to your approved categories: ${profile.categories.join(" · ")}`}
      />
      <Sect>Open — quote before the deadline</Sect>
      <Panel>{open.map((r) => <Row key={r.id} r={r} />)}</Panel>
      <Sect>Recently closed</Sect>
      <Panel>{closed.map((r) => <Row key={r.id} r={r} />)}</Panel>
      <NoteFlag className="mt-2.5">
        non-winning outcome wording (&ldquo;closed&rdquo; vs &ldquo;not
        selected&rdquo;) pending obd-07 · requirement origins are never shown
        to suppliers
      </NoteFlag>
    </main>
  );
}

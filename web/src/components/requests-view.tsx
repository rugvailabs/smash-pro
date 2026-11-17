"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chip, NoteFlag, Panel, Sect, type ChipTone } from "@/components/buyer-ui";
import { useToast } from "@/components/toast";
import type { BuyerRequest } from "@/lib/types";

/* ============================================================
   Product requests — BUY-007 (Workflow K), now REAL (I3):
   submission creates a request record for Smash Pro sourcing
   review. Attachment upload remains metadata-only (ADR-0005).
   D12 (PUBLIC enquiry) is unrelated and remains pending review —
   this is the approved signed-in buyer workflow.
   ============================================================ */

const TONE: Record<string, ChipTone> = { "in-review": "info", available: "ok", declined: "bad" };

/** C9 mini-timeline: the request's journey, derived only from the existing
 *  status — status transparency is this feature's whole value (Workflow K). */
function RequestTrail({ r }: { r: BuyerRequest }) {
  const reviewDone = r.status !== "in-review";
  const steps = [
    { label: `Submitted ${r.submitted}`, text: "text-n600", dot: "bg-ok" },
    { label: "Sourcing review", text: reviewDone ? "text-n600" : "font-medium text-ink", dot: reviewDone ? "bg-ok" : "bg-ember-deep" },
    r.status === "available"
      ? { label: "Available in catalogue", text: "text-ok", dot: "bg-ok" }
      : r.status === "declined"
      ? { label: "Declined · reason on record", text: "text-bad", dot: "bg-bad" }
      : { label: "Outcome", text: "text-n400", dot: "bg-n200" },
  ];
  const items: React.ReactNode[] = [];
  steps.forEach((s, i) => {
    if (i > 0) items.push(<span key={`r${i}`} aria-hidden className="h-px w-4 shrink-0 bg-n200" />);
    items.push(
      <span key={s.label} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap ${s.text}`}>
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  });
  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto pt-2 font-mono text-[10px] uppercase tracking-wide">
      {items}
    </div>
  );
}

const CATEGORIES = [
  "Cricket", "Football", "Basketball", "Volleyball", "Badminton", "Tennis",
  "Athletics", "Gym & Fitness", "Indoor Games", "Outdoor Games", "Sportswear", "Accessories",
];

export function RequestsView({ requests }: { requests: BuyerRequest[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", cat: "Athletics", qty: "", date: "", spec: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const canSubmit = form.name.trim().length > 0 && Number(form.qty) >= 1 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.name.trim(), category: form.cat, qty: Number(form.qty),
          neededBy: form.date.trim() || undefined, spec: form.spec.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "The request could not be submitted.");
        return;
      }
      toast(`Request ${data.id} submitted for sourcing review.`);
      setForm({ name: "", cat: "Athletics", qty: "", date: "", spec: "" });
      router.refresh();
    } catch {
      setError("The request could not be submitted.");
    } finally {
      setBusy(false);
    }
  };

  const input = "h-10 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink placeholder:text-n400";
  const label = "mb-1.5 block text-[13px] font-medium text-ink";

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
      {/* min-w-0: grid items default to min-width auto, so the trail's
          nowrap min-content would otherwise widen the page (no-clip rule) */}
      <div className="min-w-0">
        <Sect>My requests</Sect>
        <Panel>
          {requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3.5 last:border-b-0">
              <div className="min-w-[220px] flex-1">
                <div className="text-sm font-medium text-ink">{r.title}</div>
                <div className="text-[13px] text-n600">
                  <span className="font-mono text-xs">{r.id}</span> · {r.category} ·{" "}
                  <span className="num">qty {r.qty}</span>
                  {r.neededBy && <> · needed by {r.neededBy}</>} · submitted {r.submitted}
                </div>
              </div>
              <Chip tone={TONE[r.status]}>{r.statusLabel}</Chip>
              {r.status === "available" && (
                <Link href="/catalog?cat=indoor-games" className="inline-flex h-8 items-center rounded-[2px] border border-n400 bg-chalk px-3 text-[13px] font-semibold text-ink hover:border-ink">
                  View product
                </Link>
              )}
              <RequestTrail r={r} />
            </div>
          ))}
        </Panel>
        <NoteFlag className="mt-2.5">
          declined requests carry an admin reason (shown in detail view) ·
          requests may be merged with similar institutional demand for sourcing
        </NoteFlag>
      </div>

      <div className="min-w-0">
        <Sect>New request</Sect>
        <Panel className="p-5">
          <NoteFlag className="mb-3.5">
            submission is live — requests go to smash pro sourcing review
            (buy-007) · attachment upload records metadata only (adr-0005)
          </NoteFlag>
          <div className="mb-3.5">
            <label className={label} htmlFor="rq-name">Product (required)</label>
            <input id="rq-name" type="text" className={input} value={form.name} onChange={set("name")}
              placeholder="e.g. High-jump landing mat, 4×3 m" />
          </div>
          <div className="mb-3.5 grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="rq-cat">Category (required)</label>
              <select id="rq-cat" className={input} value={form.cat} onChange={set("cat")}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="rq-qty">Quantity (required)</label>
              <input id="rq-qty" type="number" min={1} className={input} value={form.qty} onChange={set("qty")} placeholder="1" />
            </div>
          </div>
          <div className="mb-3.5">
            <label className={label} htmlFor="rq-date">Needed by</label>
            <input id="rq-date" type="text" className={input} value={form.date} onChange={set("date")} placeholder="DD MMM YYYY" />
          </div>
          <div className="mb-3.5">
            <label className={label} htmlFor="rq-spec">Specifications</label>
            <textarea id="rq-spec" rows={3} value={form.spec} onChange={set("spec")}
              placeholder="Dimensions, grade, standards, brand preferences…"
              className="w-full rounded-[2px] border border-n400 bg-chalk p-3 text-sm text-ink placeholder:text-n400" />
          </div>
          <div className="mb-4">
            <span className={label}>Reference images or links</span>
            <div className="rounded-[2px] border border-dashed border-n400 bg-paper px-4 py-6 text-center text-sm text-n600">
              Drag files here, or <b className="text-ink">browse</b>
              <NoteFlag className="mt-1.5">non-functional prototype</NoteFlag>
            </div>
          </div>
          {error && (
            <p className="mb-2.5 border-l-[3px] border-bad bg-bad-t px-3 py-2 text-[13px] text-ink">{error}</p>
          )}
          <button
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="inline-flex h-11 w-full items-center justify-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400"
          >
            {busy ? "Submitting…" : "Submit request"}
          </button>
          <p className="mt-2.5 text-[13px] text-n600">
            Requests go to the Smash Pro team for sourcing review and may be
            declined with a reason.
          </p>
        </Panel>
      </div>
    </div>
  );
}

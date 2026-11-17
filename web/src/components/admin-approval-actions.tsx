"use client";

import { useState } from "react";
import { NoteFlag, Panel, PanelHead } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { ADMIN_CATEGORIES, AuditNote, btnEmber, btnGhost } from "@/components/admin-ui";
import type { AdminOrgRow } from "@/lib/admin-types";

/* ============================================================
   Organization review actions (ADM queue). For SUPPLIERS the
   admin reviews/edits the requested category list — approval
   SENDS the final list and requires at least one category.
   Rejection always requires a reason. Verification checklist is
   pending OBD-02 ◇ — approve/reject are the only actions.
   ============================================================ */

export function ApprovalActions({ org }: { org: AdminOrgRow }) {
  const { busy, error, call } = useAdminCall();
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [cats, setCats] = useState<string[]>(org.requestedCategories ?? []);

  const isSupplier = org.kind === "supplier";
  const toggleCat = (slug: string) =>
    setCats((xs) => (xs.includes(slug) ? xs.filter((x) => x !== slug) : [...xs, slug]));

  const approve = async () => {
    setMode("approve");
    await call("/api/admin/approve-org", {
      body: isSupplier ? { orgId: org.id, categories: cats } : { orgId: org.id },
      done: `${org.name} approved${isSupplier ? ` for ${cats.length} categor${cats.length === 1 ? "y" : "ies"}` : ""}.`,
    });
    setMode(null);
  };

  const reject = async () => {
    if (!reason.trim()) return;
    setMode("reject");
    await call("/api/admin/reject-org", {
      body: { orgId: org.id, reason: reason.trim() },
      done: `${org.name} rejected — reason on record.`,
    });
    setMode(null);
  };

  return (
    <Panel>
      <PanelHead title="Decision" />
      <div className="p-4">
        {isSupplier && (
          <>
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[.07em] text-n600">
              Requested categories — review before approval
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {ADMIN_CATEGORIES.map((c) => {
                const requested = org.requestedCategories?.includes(c.slug) ?? false;
                return (
                  <label
                    key={c.slug}
                    className="flex min-h-8 cursor-pointer items-center gap-2 text-[13px] text-ink"
                  >
                    <input
                      type="checkbox"
                      checked={cats.includes(c.slug)}
                      onChange={() => toggleCat(c.slug)}
                      className="h-4 w-4 accent-ember-deep"
                    />
                    <span className={cats.includes(c.slug) ? "" : "text-n600"}>{c.label}</span>
                    {requested && (
                      <span className="font-mono text-[9px] uppercase tracking-wide text-n400">req</span>
                    )}
                  </label>
                );
              })}
            </div>
            <NoteFlag className="mt-2">
              approval activates the supplier for exactly the checked
              categories — the self-declared list is a request, not a grant
            </NoteFlag>
          </>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => void approve()}
            disabled={busy || (isSupplier && cats.length === 0)}
            className={btnEmber}
          >
            {busy && mode === "approve"
              ? "Approving…"
              : isSupplier
                ? `Approve supplier (${cats.length})`
                : "Approve buyer"}
          </button>
          <button
            onClick={() => setRejectOpen((v) => !v)}
            disabled={busy}
            className={btnGhost}
            aria-expanded={rejectOpen}
          >
            Reject…
          </button>
        </div>
        {isSupplier && cats.length === 0 && (
          <p className="mt-2 text-xs text-n600">Select at least one category to approve.</p>
        )}

        {rejectOpen && (
          <div className="mt-3.5 rounded-[2px] border border-n200 bg-paper p-3.5">
            <label htmlFor="rej-reason" className="mb-1.5 block text-[13px] font-medium text-ink">
              Rejection reason (required — recorded and shown to the registrant)
            </label>
            <textarea
              id="rej-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. GSTIN could not be matched to the stated legal name"
              className="w-full rounded-[2px] border border-n400 bg-chalk p-3 text-sm text-ink placeholder:text-n400"
            />
            <button
              onClick={() => void reject()}
              disabled={busy || !reason.trim()}
              className="mt-2.5 inline-flex h-10 items-center rounded-[2px] border border-bad bg-chalk px-4 text-sm font-semibold text-bad hover:bg-bad-t disabled:cursor-not-allowed disabled:border-n200 disabled:text-n400"
            >
              {busy && mode === "reject" ? "Rejecting…" : "Confirm rejection"}
            </button>
          </div>
        )}

        <ActionError error={error} />
        <NoteFlag className="mt-3.5">
          verification checklist pending obd-02 ◇ — approve / reject are the
          only actions here
        </NoteFlag>
        <AuditNote />
      </div>
    </Panel>
  );
}

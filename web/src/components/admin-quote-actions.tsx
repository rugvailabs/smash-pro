"use client";

import { useState } from "react";
import { NoteFlag } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { btnEmberSm, btnGhostSm, inputCls } from "@/components/admin-ui";

/* ============================================================
   Per-quotation actions on the sourcing comparison board:
   message into the private supplier thread, formal revision
   request (system marker on the supplier side), and Award — the
   ONE Ember action per requirement, with an explicit inline
   confirm because awarding closes the other quotes.
   ============================================================ */

export function QuoteActions({
  quotationId, supplierName, canAward,
}: {
  quotationId: number;
  supplierName: string;
  canAward: boolean;
}) {
  const { busy, error, call } = useAdminCall();
  const [text, setText] = useState("");
  const [panel, setPanel] = useState<"none" | "revise" | "award">("none");
  const [note, setNote] = useState("");

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    if (await call(`/api/admin/quotations/${quotationId}/message`, { body: { text: body } })) {
      setText("");
    }
  };

  const requestRevision = async () => {
    if (!note.trim()) return;
    if (
      await call(`/api/admin/quotations/${quotationId}/request-revision`, {
        body: { note: note.trim() },
        done: `Revision requested from ${supplierName}.`,
      })
    ) {
      setNote("");
      setPanel("none");
    }
  };

  const award = async () => {
    if (
      await call(`/api/admin/quotations/${quotationId}/award`, {
        done: `Awarded to ${supplierName}. Issue the purchase order below.`,
      })
    ) {
      setPanel("none");
    }
  };

  return (
    <div className="border-t border-n100 px-3.5 py-3">
      {/* message composer — thread is private to this supplier */}
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
          placeholder={`Message ${supplierName}`}
          aria-label={`Message ${supplierName}`}
          className="h-8 flex-1 rounded-[2px] border border-n400 bg-chalk px-2.5 text-[13px] text-ink placeholder:text-n400"
        />
        <button onClick={() => void send()} disabled={busy || !text.trim()} className={btnGhostSm}>
          Send
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setPanel(panel === "revise" ? "none" : "revise")}
          disabled={busy}
          className={btnGhostSm}
          aria-expanded={panel === "revise"}
        >
          Request revision…
        </button>
        {canAward && (
          <button
            onClick={() => setPanel(panel === "award" ? "none" : "award")}
            disabled={busy}
            className={btnEmberSm}
            aria-expanded={panel === "award"}
          >
            Award
          </button>
        )}
      </div>

      {panel === "revise" && (
        <div className="mt-2.5 rounded-[2px] border border-n200 bg-paper p-3">
          <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor={`rev-${quotationId}`}>
            What should {supplierName} revise?
          </label>
          <input
            id={`rev-${quotationId}`}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Need unit below ₹2,300 at this quantity"
            className={`${inputCls} h-9 text-[13px]`}
          />
          <button
            onClick={() => void requestRevision()}
            disabled={busy || !note.trim()}
            className={`${btnGhostSm} mt-2`}
          >
            {busy ? "Sending…" : "Send revision request"}
          </button>
          <NoteFlag className="mt-1.5">appears as a formal system marker in the supplier thread</NoteFlag>
        </div>
      )}

      {panel === "award" && (
        <div className="mt-2.5 rounded-[2px] border border-ember-deep bg-paper p-3">
          <p className="text-[13px] text-ink">
            Award this requirement to <b>{supplierName}</b>? The other
            quotations close; the award is recorded and a purchase order can
            then be issued.
          </p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => void award()} disabled={busy} className={btnEmberSm}>
              {busy ? "Awarding…" : "Confirm award"}
            </button>
            <button onClick={() => setPanel("none")} disabled={busy} className={btnGhostSm}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <ActionError error={error} />
    </div>
  );
}

/* ---------- post-award: issue the purchase order ---------- */

export function IssuePo({
  quotationId, supplierName, products = [], items,
}: {
  quotationId: number;
  supplierName: string;
  /** catalogue products to optionally link PO line(s) to, so Brand (and any
   *  future product-linked data) resolves automatically — purely
   *  informational, never changes the quotation's own price/qty/terms */
  products?: { sku: string; name: string; brand: string | null; catSlug: string }[];
  /** product titles, when the awarded quotation is itemized (multi-product)
   *  — one PO line (and optional SKU link) issues per entry */
  items?: string[];
}) {
  const { busy, error, call } = useAdminCall();
  const [destination, setDestination] = useState<"warehouse" | "direct">("warehouse");
  const [sku, setSku] = useState("");
  const [itemSkus, setItemSkus] = useState<string[]>(() => (items ?? []).map(() => ""));

  const skuSelect = (value: string, onChange: (v: string) => void, id: string) => (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink"
    >
      <option value="">Not linked to a catalogue product</option>
      {products.map((p) => (
        <option key={p.sku} value={p.sku}>
          {p.sku} — {p.name}{p.brand ? ` (${p.brand})` : ""}
        </option>
      ))}
    </select>
  );

  return (
    <div className="rounded-[2px] border border-n200 bg-chalk p-4">
      <div className="mb-1 font-display text-base font-semibold text-ink">Issue purchase order</div>
      <p className="mb-3 text-[13px] text-n600">
        Awarded to {supplierName}. Issuing the PO{items && items.length > 1 ? "s" : ""} opens
        fulfilment and the payment record for this procurement
        {items && items.length > 1 ? <> — one PO line per product</> : null}.
      </p>
      <div className="mb-3">
        <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="po-dest">
          Fulfilment destination
        </label>
        <select
          id="po-dest"
          value={destination}
          onChange={(e) => setDestination(e.target.value as "warehouse" | "direct")}
          className="h-10 w-64 rounded-[2px] border border-n400 bg-chalk px-3 text-sm text-ink"
        >
          <option value="warehouse">Smash Pro warehouse</option>
          <option value="direct">Direct to buyer</option>
        </select>
      </div>

      {items && items.length > 1 ? (
        <div className="mb-3 space-y-2.5">
          {items.map((title, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2.5">
              <span className="min-w-0 flex-1 text-[13px] text-ink">{title}</span>
              <div className="w-64">
                {skuSelect(itemSkus[i] ?? "", (v) => setItemSkus(itemSkus.map((s, idx) => (idx === i ? v : s))), `po-sku-${i}`)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3 w-64">
          <label className="mb-1.5 block text-[13px] font-medium text-ink" htmlFor="po-sku">
            Catalogue product (optional)
          </label>
          {skuSelect(sku, setSku, "po-sku")}
        </div>
      )}

      <button
        onClick={() =>
          void call("/api/admin/pos", {
            body: items && items.length > 1
              ? { quotationId, destination, itemSkus: itemSkus.map((s) => s || null) }
              : { quotationId, destination, sku: sku || null },
            done: items && items.length > 1 ? "Purchase orders issued." : "Purchase order issued.",
          })
        }
        disabled={busy}
        className="inline-flex h-10 items-center rounded-[2px] bg-ember-deep px-4 text-sm font-semibold text-white hover:bg-ember-press disabled:cursor-not-allowed disabled:bg-n200 disabled:text-n400"
      >
        {busy ? "Issuing…" : items && items.length > 1 ? "Issue purchase orders" : "Issue purchase order"}
      </button>
      <NoteFlag className="mt-2">
        direct shipment requires the supplier&rsquo;s direct privilege
        (obd-19) — the server enforces this on issue · linking a catalogue
        product only resolves its brand for the purchase orders list, it
        never changes price, quantity or terms (those stay the quotation&rsquo;s own)
      </NoteFlag>
      <ActionError error={error} />
    </div>
  );
}

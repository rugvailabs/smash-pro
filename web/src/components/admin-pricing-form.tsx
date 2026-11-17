"use client";

import { useState } from "react";
import { Panel, PanelHead } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { ADMIN_CATEGORIES, AuditNote, btnEmber, inputCls, labelCls } from "@/components/admin-ui";
import type { AdminPriceRule } from "@/lib/admin-types";

/* ============================================================
   Price rules (OBD-20 Option A): discounts in basis points,
   precedence org-product > org-category > category-default.
   Scope select drives the visible fields. Delete is a two-step
   inline confirm — removing a rule changes live buyer pricing.
   ============================================================ */

const pct = (bp: number) => `${(bp / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;

export function PriceRuleForm({ buyers }: { buyers: { id: number; name: string }[] }) {
  const { busy, error, call } = useAdminCall();
  const [scope, setScope] = useState<AdminPriceRule["scope"]>("org-category");
  const [orgId, setOrgId] = useState<string>(buyers[0] ? String(buyers[0].id) : "");
  const [catSlug, setCatSlug] = useState("cricket");
  const [sku, setSku] = useState("");
  const [bp, setBp] = useState("");

  const needsOrg = scope !== "category-default";
  const needsCat = scope !== "org-product";
  const needsSku = scope === "org-product";
  const bpNum = parseInt(bp, 10);
  const bpOk = Number.isFinite(bpNum) && bpNum > 0 && bpNum < 10000;
  const canSubmit =
    bpOk && (!needsOrg || orgId !== "") && (!needsSku || sku.trim().length > 0) && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    if (
      await call("/api/admin/price-rules", {
        body: {
          scope,
          orgId: needsOrg ? Number(orgId) : undefined,
          catSlug: needsCat ? catSlug : undefined,
          sku: needsSku ? sku.trim().toUpperCase() : undefined,
          discountBp: bpNum,
        },
        done: `Price rule created — ${pct(bpNum)} off standard.`,
      })
    ) {
      setBp("");
      setSku("");
    }
  };

  return (
    <Panel>
      <PanelHead title="New price rule" />
      <div className="p-4">
        <div className="grid gap-3.5">
          <div>
            <label className={labelCls} htmlFor="pr-scope">Scope</label>
            <select
              id="pr-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as AdminPriceRule["scope"])}
              className={inputCls}
            >
              <option value="category-default">Category default — every approved buyer</option>
              <option value="org-category">Organization × category</option>
              <option value="org-product">Organization × product (SKU)</option>
            </select>
          </div>
          {needsOrg && (
            <div>
              <label className={labelCls} htmlFor="pr-org">Buyer organization</label>
              <select id="pr-org" value={orgId} onChange={(e) => setOrgId(e.target.value)} className={inputCls}>
                {buyers.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          {needsCat && (
            <div>
              <label className={labelCls} htmlFor="pr-cat">Category</label>
              <select id="pr-cat" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} className={inputCls}>
                {ADMIN_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
          {needsSku && (
            <div>
              <label className={labelCls} htmlFor="pr-sku">SKU</label>
              <input id="pr-sku" type="text" value={sku} onChange={(e) => setSku(e.target.value)}
                placeholder="CR-0417" className={`${inputCls} font-mono uppercase`} />
            </div>
          )}
          <div>
            <label className={labelCls} htmlFor="pr-bp">Discount (basis points)</label>
            <input id="pr-bp" type="number" min={1} max={9999} value={bp} onChange={(e) => setBp(e.target.value)}
              placeholder="1500" className={`${inputCls} num`} />
            <p className="mt-1 text-xs text-n600">
              {bpOk ? <>= <b className="num text-ink">{pct(bpNum)}</b> off the standard listed price</> : "100 bp = 1%"}
            </p>
          </div>
        </div>
        <ActionError error={error} />
        <button onClick={() => void submit()} disabled={!canSubmit} className={`${btnEmber} mt-4`}>
          {busy ? "Creating…" : "Create rule"}
        </button>
        <AuditNote />
      </div>
    </Panel>
  );
}

export function RuleDelete({ id }: { id: number }) {
  const { busy, error, call } = useAdminCall();
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="font-mono text-[10px] uppercase tracking-wide text-n600 underline-offset-2 hover:text-bad hover:underline"
      >
        remove
      </button>
    );
  }
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <button
          onClick={() =>
            void call(`/api/admin/price-rules/${id}`, { method: "DELETE", done: "Price rule removed." })
          }
          disabled={busy}
          className="inline-flex h-7 items-center rounded-[2px] border border-bad bg-chalk px-2 text-[12px] font-semibold text-bad hover:bg-bad-t disabled:text-n400"
        >
          {busy ? "…" : "Confirm"}
        </button>
        <button onClick={() => setConfirm(false)} disabled={busy}
          className="font-mono text-[10px] uppercase text-n600 hover:text-ink">
          keep
        </button>
      </span>
      <ActionError error={error} className="mt-0 max-w-[220px] text-left" />
    </span>
  );
}

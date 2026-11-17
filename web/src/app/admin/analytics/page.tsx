import { Suspense } from "react";
import type { Metadata } from "next";
import { NoteFlag, Panel, PanelHead, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, tdCls, trCls } from "@/components/admin-ui";
import { getAdminCounts, getAnalyticsAdmin } from "@/lib/admin-api";
import { inr } from "@/lib/format";

/* ADM analytics — operator-useful, fully-derivable metrics: GMV by status,
   order-value trend by placed month, top categories / buyers / suppliers, and
   the PO fulfilment funnel. CSS bars and dense tables, no chart library. Every
   figure aggregates real rows — nothing is invented (OBD figures stay absent). */

export const metadata: Metadata = { title: "Analytics" };

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminAnalyticsContent />
    </Suspense>
  );
}

function Fig({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[.07em] text-n600">{label}</div>
      <div className="num mt-1 font-display text-[21px] font-bold text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-n600">{sub}</div>}
    </div>
  );
}

function Bar({ label, value, max, right }: { label: string; value: number; max: number; right: React.ReactNode }) {
  const w = Math.max(2, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-32 shrink-0 truncate text-sm text-n800 sm:w-44">{label}</span>
      <span className="h-4 flex-1 rounded-[1px] bg-n100">
        <span className="block h-full rounded-[1px] bg-ink" style={{ width: `${w}%` }} aria-hidden />
      </span>
      <span className="num w-28 shrink-0 text-right text-sm font-semibold text-ink">{right}</span>
    </div>
  );
}

async function AdminAnalyticsContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const a = await getAnalyticsAdmin();
  if (!a) return <AdminGate />;

  const maxStatus = Math.max(...a.orders.byStatus.map((s) => s.value), 1);
  const maxMonth = Math.max(...a.monthlyTrend.map((m) => m.value), 1);
  const maxCat = Math.max(...a.topCategories.map((c) => c.value), 1);
  const maxFunnel = Math.max(...a.fulfilmentFunnel.map((f) => f.count), 1);

  return (
    <main>
      <AdminHead
        title="Business analytics"
        sub={<>Derived operational metrics — read-only
          <NoteFlag className="mt-1">illustrative demo data — figures &amp; amounts are sample values, gst-inclusive</NoteFlag></>}
      />

      <div className="grid items-start gap-5 md:grid-cols-2">
        <Panel>
          <PanelHead title="Orders & GMV by status" />
          <div className="grid grid-cols-2 gap-4 px-4 py-4">
            <Fig label="Orders placed" value={a.orders.count} />
            <Fig label="GMV" value={inr(a.orders.gmv)} sub="incl. GST" />
          </div>
          <div className="border-t border-n100 px-4 py-3">
            {a.orders.byStatus.map((s) => (
              <Bar key={s.label} label={s.label} value={s.value} max={maxStatus}
                right={<>{inr(s.value)} <span className="font-mono text-[10px] text-n400">· {s.count}</span></>} />
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead title="PO fulfilment funnel" aside={<span className="font-mono text-[11px] text-n600">current stage</span>} />
          <div className="px-4 py-4">
            {a.fulfilmentFunnel.map((f) => (
              <Bar key={f.label} label={f.label} value={f.count} max={maxFunnel} right={f.count} />
            ))}
          </div>
        </Panel>
      </div>

      <Sect>Order value by month</Sect>
      <Panel className="px-4 py-4">
        {a.monthlyTrend.length === 0 ? (
          <p className="py-2 text-sm text-n600">No dated orders to trend yet.</p>
        ) : (
          a.monthlyTrend.map((m) => (
            <Bar key={m.month} label={m.month} value={m.value} max={maxMonth}
              right={<>{inr(m.value)} <span className="font-mono text-[10px] text-n400">· {m.count}</span></>} />
          ))
        )}
      </Panel>

      <Sect>Top categories by order value</Sect>
      <Panel className="px-4 py-4">
        {a.topCategories.map((c) => (
          <Bar key={c.slug} label={c.name} value={c.value} max={maxCat} right={inr(c.value)} />
        ))}
      </Panel>

      <div className="grid items-start gap-5 md:grid-cols-2">
        <div>
          <Sect>Top buyers by spend</Sect>
          <AdminTable minW={360} cols={[{ h: "Buyer" }, { h: "Orders", right: true }, { h: "Value", right: true }]}>
            {a.topBuyers.map((b) => (
              <tr key={b.orgId} className={trCls}>
                <td className={`${tdCls} text-[13px] text-ink`}>{b.name}</td>
                <td className={`${tdCls} num text-right text-n800`}>{b.orders}</td>
                <td className={`${tdCls} num text-right font-semibold text-ink`}>{inr(b.value)}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
        <div>
          <Sect>Top suppliers by PO value</Sect>
          <AdminTable minW={360} cols={[{ h: "Supplier" }, { h: "POs", right: true }, { h: "Value", right: true }]}>
            {a.topSuppliers.map((s) => (
              <tr key={s.orgId} className={trCls}>
                <td className={`${tdCls} text-[13px] text-ink`}>{s.name}</td>
                <td className={`${tdCls} num text-right text-n800`}>{s.pos}</td>
                <td className={`${tdCls} num text-right font-semibold text-ink`}>{inr(s.value)}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </div>

      <NoteFlag className="mt-4">
        all figures aggregate real rows (orders, lines, purchase orders) · gst-inclusive ·
        commission / settlement reporting pending obd-14 / obd-21 ◇
      </NoteFlag>
    </main>
  );
}

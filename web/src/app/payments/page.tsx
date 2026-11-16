import Link from "next/link";
import type { Metadata } from "next";
import { RequireBuyer } from "@/components/require-buyer";
import { Banner, Chip, NoteFlag, PageHead, type ChipTone } from "@/components/buyer-ui";
import { getOrders } from "@/lib/buyer-api";
import { inr } from "@/lib/format";

/* Payments & invoices — one record per order payment (OBD-21), with
   invoice/receipt references (design reference only — OBD-11 pending). */

export const metadata: Metadata = { title: "Payments & invoices" };

const PAY_TONE: Record<string, ChipTone> = {
  confirmed: "ok", "awaiting-verification": "warn", failed: "bad", "cancelled-unpaid": "bad",
};

export default async function PaymentsPage() {
  const orders = await getOrders();

  return (
    <RequireBuyer>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10">
        <PageHead
          title={<>Payments &amp; invoices</>}
          sub="Every payment on record — 100% advance, verified before dispatch."
        />

        <div className="hidden overflow-x-auto rounded-[2px] border border-n200 bg-chalk md:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Order", "Date", "Method", "Reference", "Status", "Amount", "Documents"].map((h, i) => (
                  <th key={h} className={`whitespace-nowrap border-b border-n200 px-3.5 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[.07em] text-n600 ${i === 5 ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-n100 last:border-b-0 hover:bg-paper">
                  <td className="px-3.5 py-2.5">
                    <Link href={`/orders/${o.id}`} className="font-mono text-[12.5px] text-ink hover:underline">{o.id}</Link>
                  </td>
                  <td className="px-3.5 py-2.5">{o.payment.confirmedAt?.split(",")[0] ?? o.placed}</td>
                  <td className="px-3.5 py-2.5">{o.payment.method}</td>
                  <td className="px-3.5 py-2.5 font-mono text-xs text-n600">{o.payment.reference ?? "—"}</td>
                  <td className="px-3.5 py-2.5"><Chip tone={PAY_TONE[o.payment.status]}>{o.payment.statusLabel}</Chip></td>
                  <td className="num px-3.5 py-2.5 text-right font-semibold text-ink">{inr(o.total)}</td>
                  <td className="px-3.5 py-2.5">
                    {o.payment.status === "confirmed" ? (
                      <span className="cursor-not-allowed text-[13px] font-semibold text-n400" aria-disabled>
                        Invoice · receipt (prototype)
                      </span>
                    ) : (
                      <span className="text-[13px] text-n600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* mobile cards */}
        <div className="space-y-3 md:hidden">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="block rounded-[2px] border border-n200 bg-chalk p-4">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="font-mono text-[12.5px] text-ink">{o.id}</span>
                <Chip tone={PAY_TONE[o.payment.status]}>{o.payment.statusLabel}</Chip>
              </div>
              <div className="flex items-center justify-between gap-3 py-1 text-[13px]">
                <span className="text-n600">{o.payment.method}{o.payment.reference ? <> · <span className="font-mono text-xs">{o.payment.reference}</span></> : ""}</span>
                <span className="num font-semibold text-ink">{inr(o.total)}</span>
              </div>
            </Link>
          ))}
        </div>

        <Banner tone="info" className="mt-5 max-w-[720px]">
          <b className="text-ink">Offline payments.</b> NEFT/RTGS and cheque
          payments count as confirmed only after admin verification of the
          uploaded proof. Refunds, where approved, default to the original
          payment method (OBD-21).
        </Banner>
        <NoteFlag className="mt-3">
          amounts illustrative · invoice &amp; receipt downloads are design
          references only — timing &amp; format pending obd-11 · refund rules
          admin-configurable (obd-21)
        </NoteFlag>
      </main>
    </RequireBuyer>
  );
}

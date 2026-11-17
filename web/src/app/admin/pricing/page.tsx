import { Suspense } from "react";
import type { Metadata } from "next";
import { Banner, NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead, AdminTable, catLabel, tdCls, trCls } from "@/components/admin-ui";
import { PriceRuleForm, RuleDelete } from "@/components/admin-pricing-form";
import { getAdminCounts, getOrganizationsAdmin, getPriceRulesAdmin } from "@/lib/admin-api";
import type { AdminPriceRule } from "@/lib/admin-types";

/* ADM pricing — OBD-20 Option A (decided): discounts off the public
   standard listed price, in basis points, with precedence
   org-product > org-category > category-default; discount applies
   before GST presentation. Rules grouped by scope so the precedence
   reads top-down. */

export const metadata: Metadata = { title: "Pricing" };

const bpText = (bp: number) =>
  `${bp} bp · ${(bp / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;

export default function AdminPricingPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminPricingContent />
    </Suspense>
  );
}

function RuleRows({ rules, show }: { rules: AdminPriceRule[]; show: ("org" | "cat" | "sku")[] }) {
  return (
    <>
      {rules.map((r) => (
        <tr key={r.id} className={trCls}>
          {show.includes("org") && <td className={tdCls}>{r.orgName ?? "—"}</td>}
          {show.includes("cat") && <td className={tdCls}>{r.catSlug ? catLabel(r.catSlug) : "—"}</td>}
          {show.includes("sku") && (
            <td className={`${tdCls} font-mono text-[12.5px]`}>{r.sku ?? "—"}</td>
          )}
          <td className={`${tdCls} num whitespace-nowrap text-right font-semibold text-ink`}>{bpText(r.discountBp)}</td>
          <td className={`${tdCls} text-right`}><RuleDelete id={r.id} /></td>
        </tr>
      ))}
    </>
  );
}

async function AdminPricingContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const [rules, activeOrgs] = await Promise.all([
    getPriceRulesAdmin(),
    getOrganizationsAdmin("active"),
  ]);
  const buyers = activeOrgs
    .filter((o) => o.kind === "buyer")
    .map((o) => ({ id: o.id, name: o.name }));

  const catDefault = rules.filter((r) => r.scope === "category-default");
  const orgCategory = rules.filter((r) => r.scope === "org-category");
  const orgProduct = rules.filter((r) => r.scope === "org-product");

  return (
    <main>
      <AdminHead
        title="Pricing"
        sub={<><span className="num">{rules.length}</span> active rules — discounts off the public standard listed price</>}
      />

      <Banner tone="info" className="mb-6">
        <b className="text-ink">OBD-20 Option A (decided).</b> The most
        specific rule wins: org-product &gt; org-category &gt;
        category-default. Discounts are expressed in basis points off the
        standard listed price and apply <b className="text-ink">before</b> GST
        presentation. GST rates per HSN remain pending tax confirmation.
      </Banner>

      <div className="grid items-start gap-7 xl:grid-cols-[7fr_5fr]">
        <div className="min-w-0">
          <Sect>Category default — every approved buyer</Sect>
          <AdminTable minW={420} cols={[{ h: "Category" }, { h: "Discount", right: true }, { h: "" }]}>
            <RuleRows rules={catDefault} show={["cat"]} />
          </AdminTable>
          <NoteFlag className="mt-2">the approved-buyer base tier — e.g. 1500 bp · 15% across a category</NoteFlag>

          <Sect>Organization × category</Sect>
          <AdminTable minW={520} cols={[{ h: "Organization" }, { h: "Category" }, { h: "Discount", right: true }, { h: "" }]}>
            <RuleRows rules={orgCategory} show={["org", "cat"]} />
          </AdminTable>

          <Sect>Organization × product</Sect>
          <AdminTable minW={520} cols={[{ h: "Organization" }, { h: "SKU" }, { h: "Discount", right: true }, { h: "" }]}>
            <RuleRows rules={orgProduct} show={["org", "sku"]} />
          </AdminTable>
          <NoteFlag className="mt-2.5">
            negotiated terms per institution — the most specific rule overrides
            the tiers above · removing a rule changes live buyer pricing
            immediately
          </NoteFlag>
        </div>

        <div className="min-w-0">
          <Sect>Create rule</Sect>
          <PriceRuleForm buyers={buyers} />
        </div>
      </div>
    </main>
  );
}

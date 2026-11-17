import { Suspense } from "react";
import type { Metadata } from "next";
import { Chip, DocRow, KV, NoteFlag, PageHead, Panel, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { SupplierBusinessEdit, SupplierCategoryRequest } from "@/components/supplier-profile-edit";
import { getSupplierProfile, getSupplyItems } from "@/lib/supplier-api";

/* Supplier profile — SUP-003 · ADM-020 AC5. Direct-shipment eligibility:
   VIEW-ONLY, admin-controlled (supplier + per-product flags, OBD-19
   Option C). Document states are neutral illustrative prototype data —
   OBD-02 verification workflow is ◇ proposed. Sensitive-field edits route
   to admin re-review (field list pending). Multi-user orgs pending OBD-15. */

export const metadata: Metadata = { title: "Supplier profile" };

export default function SupplierProfilePage() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <SupplierProfileContent />
    </Suspense>
  );
}

async function SupplierProfileContent() {
  const [p, items] = await Promise.all([getSupplierProfile(), getSupplyItems()]);

  return (
    <main>
      <PageHead
        title="Supplier profile"
        sub={<span className="inline-flex items-center gap-2">{p.name} <Chip tone="ok">Active</Chip></span>}
      />

      <div className="grid items-start gap-7 lg:grid-cols-2">
        <div>
          <Sect>Business details</Sect>
          <Panel className="px-5 py-4">
            <KV k="Legal name">{p.legalName}</KV>
            <KV k="Supplier type">{p.type}</KV>
            <KV k="GSTIN"><span className="font-mono text-[12.5px]">{p.gstin}</span></KV>
            <KV k="Contact">{p.contact}</KV>
            <KV k="Email">{p.email}</KV>
            <KV k="Works address">{p.worksAddress}</KV>
            <SupplierBusinessEdit contactName={p.contact} />
          </Panel>
          <NoteFlag className="mt-2">
            edits to legal name / gstin / bank details route to smash pro
            re-review before taking effect · exact sensitive-field list pending
          </NoteFlag>

          <Sect>Documents</Sect>
          <Panel>
            {p.documents.map((d) => (
              <DocRow key={d.file} file={d.file} action={<Chip tone="neu">{d.state}</Chip>} />
            ))}
          </Panel>
          <NoteFlag className="mt-2">
            prototype data — document states are illustrative; the verification
            workflow is ◇ proposed (obd-02) and not yet an established platform
            capability
          </NoteFlag>
        </div>

        <div>
          <Sect>Categories — drive requirement matching</Sect>
          <Panel className="px-5 py-4">
            <KV k="Approved">{p.categories.join(" · ")}</KV>
            <SupplierCategoryRequest categories={p.categories} />
          </Panel>
          <NoteFlag className="mt-2">
            category changes take effect on future requirement matching after
            smash pro review
          </NoteFlag>

          <Sect>Direct-shipment eligibility — set by Smash Pro</Sect>
          <Panel className="px-5 py-4">
            <KV k="Supplier approval"><Chip tone="ok">Approved</Chip></KV>
            <KV k="Enabled products"><span className="num">{p.directEnabled.length} of {items.length} catalogue items</span></KV>
            {p.directEnabled.map(([name, state]) => (
              <KV key={name} k={name}><Chip tone="ok">{state}</Chip></KV>
            ))}
            <KV k="All other items"><Chip tone="neu">Warehouse only</Chip></KV>
          </Panel>
          <NoteFlag className="mt-2">
            view-only — both the supplier approval and per-product enablement
            are controlled by smash pro (obd-19 option c); there is no way to
            change them here · evaluation criteria ◇ proposed
          </NoteFlag>

          <Sect>Users</Sect>
          <Panel className="px-5 py-4">
            <KV k="Signed in as">{p.email}</KV>
          </Panel>
          <NoteFlag className="mt-2">
            multi-user organizations pending obd-15 — no roles designed until decided
          </NoteFlag>
        </div>
      </div>
    </main>
  );
}

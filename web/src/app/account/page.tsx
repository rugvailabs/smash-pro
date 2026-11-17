import { Suspense } from "react";
import type { Metadata } from "next";
import { RequireBuyer } from "@/components/require-buyer";
import { Chip, DocRow, KV, NoteFlag, PageHead, Panel, Sect } from "@/components/buyer-ui";
import { BuyerAccountEdit } from "@/components/buyer-account-edit";
import { BuyerAddressManager } from "@/components/buyer-address-manager";
import { PanelSkeleton } from "@/components/skeletons";
import { getAddresses, getBuyerAccount, getInstitution } from "@/lib/buyer-api";

/* Institution profile — BUY-009. Sensitive-field edits route to admin
   re-review (exact field list PENDING). Multi-user organizations PENDING
   OBD-15 — flagged placeholder, no roles invented. Document states are
   neutral illustrative prototype data — OBD-02 verification workflow is
   ◇ proposed, not established. */

export const metadata: Metadata = { title: "Institution profile" };

export default function AccountPage() {
  // session-scoped data → stream behind a skeleton (Cache Components)
  return (
    <Suspense fallback={<main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10"><PanelSkeleton /></main>}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const [inst, account, addresses] = await Promise.all([
    getInstitution(),
    getBuyerAccount(),
    getAddresses(),
  ]);

  return (
    <RequireBuyer>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10">
        <PageHead
          title="Institution profile"
          sub={<span className="inline-flex items-center gap-2">{inst.name}, {inst.city} <Chip tone="ok">Active</Chip></span>}
        />

        <div className="grid items-start gap-7 lg:grid-cols-2">
          <div>
            <Sect>Business details</Sect>
            <BuyerAccountEdit account={account} />
            <NoteFlag className="mt-2">
              edits to legal name / gstin route to smash pro re-review before
              taking effect · exact sensitive-field list pending
            </NoteFlag>

            <Sect>Documents</Sect>
            <Panel>
              {inst.documents.map((d) => (
                <DocRow key={d.file} file={d.file} action={<Chip tone="neu">{d.state}</Chip>} />
              ))}
            </Panel>
            <NoteFlag className="mt-2">
              prototype data — document states are illustrative; the
              verification workflow is ◇ proposed (obd-02) and not yet an
              established platform capability
            </NoteFlag>
          </div>

          <div>
            <Sect>Delivery addresses</Sect>
            <BuyerAddressManager addresses={addresses} />

            <Sect>Users</Sect>
            <Panel className="px-5 py-4">
              <KV k="Signed in as">{inst.email}</KV>
              <p className="mt-2.5 text-[13px] text-n600">
                Additional users and roles for your institution are under
                consideration.
              </p>
            </Panel>
            <NoteFlag className="mt-2">
              multi-user organizations pending obd-15 — no roles designed until decided
            </NoteFlag>
          </div>
        </div>
      </main>
    </RequireBuyer>
  );
}

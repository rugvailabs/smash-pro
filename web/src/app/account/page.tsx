import { RequireBuyer } from "@/components/require-buyer";
import { Chip, DocRow, KV, NoteFlag, PageHead, Panel, Sect } from "@/components/buyer-ui";
import { getInstitution } from "@/lib/buyer-api";

/* Institution profile — BUY-009. Sensitive-field edits route to admin
   re-review (exact field list PENDING). Multi-user organizations PENDING
   OBD-15 — flagged placeholder, no roles invented. Document states are
   neutral illustrative prototype data — OBD-02 verification workflow is
   ◇ proposed, not established. */

export default async function AccountPage() {
  const inst = await getInstitution();

  const btnSec = "inline-flex h-10 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink";
  const btnTer = "text-[13px] font-semibold text-ember-deep hover:underline";

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
            <Panel className="px-5 py-4">
              <KV k="Legal name">{inst.legalName}</KV>
              <KV k="Organization type">{inst.orgType}</KV>
              <KV k="GSTIN"><span className="font-mono text-[12.5px]">{inst.gstin}</span></KV>
              <KV k="Contact">{inst.contact}</KV>
              <KV k="Email">{inst.email}</KV>
              <div className="pt-3.5">
                <a href="#" className={btnSec} title="Edit flow arrives with account management">Edit business details</a>
              </div>
            </Panel>
            <NoteFlag className="mt-2">
              edits to legal name / gstin route to prosmash re-review before
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
            <Panel>
              {inst.addresses.map((a) => (
                <div key={a.label} className="flex flex-wrap items-center gap-3 border-b border-n100 px-4 py-3.5 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">
                      {a.label}
                      {a.isDefault && <span className="ml-2 align-middle"><Chip tone="neu">Default</Chip></span>}
                    </div>
                    <div className="text-[13px] text-n600">{a.detail}</div>
                  </div>
                  <a href="#" className={btnTer}>Edit</a>
                </div>
              ))}
              <div className="border-t border-n100 px-4 py-3">
                <a href="#" className={btnSec}>+ Add address</a>
              </div>
            </Panel>

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

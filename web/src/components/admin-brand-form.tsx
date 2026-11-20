"use client";

import { useState } from "react";
import { Panel, PanelHead } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { AuditNote, btnEmber, inputCls, labelCls } from "@/components/admin-ui";

/* Brand master list — add once here, then select it in the Add Product
   form. Products and purchase-order lines resolve brand through their
   linked SKU; nobody re-types a brand per product or per purchase. */

export function BrandForm() {
  const { busy, error, call } = useAdminCall();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = name.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    if (
      await call("/api/admin/brands", {
        body: { name: name.trim(), notes: notes.trim() || undefined },
        done: `${name.trim()} added to the brand list.`,
      })
    ) {
      setName("");
      setNotes("");
    }
  };

  return (
    <Panel>
      <PanelHead title="Add brand" />
      <div className="p-4">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="bf-name">Brand name (required)</label>
            <input id="bf-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SG, Yonex, Nivia" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="bf-notes">Notes</label>
            <input id="bf-notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="optional" className={inputCls} />
          </div>
        </div>
        <ActionError error={error} />
        <button onClick={() => void submit()} disabled={!canSubmit} className={`${btnEmber} mt-4`}>
          {busy ? "Adding…" : "Add brand"}
        </button>
        <AuditNote />
      </div>
    </Panel>
  );
}

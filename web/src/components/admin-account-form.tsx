"use client";

import { useState } from "react";
import { Panel, PanelHead } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { AuditNote, btnEmber, inputCls, labelCls } from "@/components/admin-ui";
import { PasswordInput } from "@/components/password-input";

/* Self-service login credentials — the signed-in admin's own email and
   password only (server-side: requireAdmin() + the row for s.userId,
   never another account). Each change re-asks the current password so
   an unattended session can't silently take over the login. */

export function AdminEmailForm({ currentEmail }: { currentEmail: string }) {
  const { busy, error, call } = useAdminCall();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const canSubmit = currentPassword.length > 0 && newEmail.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    if (
      await call("/api/admin/account/email", {
        body: { currentPassword, newEmail: newEmail.trim() },
        done: "Login email updated.",
      })
    ) {
      setCurrentPassword("");
      setNewEmail("");
    }
  };

  return (
    <Panel>
      <PanelHead title="Login email" aside={<span className="font-mono text-[12px] text-n600">{currentEmail}</span>} />
      <div className="p-4">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="ae-new">New email address</label>
            <input
              id="ae-new" type="email" autoComplete="email" value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com" className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ae-pw">Current password</label>
            <PasswordInput
              id="ae-pw" autoComplete="current-password" value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="confirm to make this change" className={inputCls}
            />
          </div>
        </div>
        <ActionError error={error} />
        <button onClick={() => void submit()} disabled={!canSubmit} className={`${btnEmber} mt-4`}>
          {busy ? "Updating…" : "Update email"}
        </button>
        <AuditNote />
      </div>
    </Panel>
  );
}

export function AdminPasswordForm() {
  const { busy, error, call } = useAdminCall();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit =
    currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    if (
      await call("/api/admin/account/password", {
        body: { currentPassword, newPassword },
        done: "Password updated.",
      })
    ) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <Panel>
      <PanelHead title="Password" />
      <div className="p-4">
        <div className="grid gap-3.5 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="ap-cur">Current password</label>
            <PasswordInput
              id="ap-cur" autoComplete="current-password" value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ap-new">New password</label>
            <PasswordInput
              id="ap-new" autoComplete="new-password" minLength={8} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="at least 8 characters" className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ap-confirm">Confirm new password</label>
            <PasswordInput
              id="ap-confirm" autoComplete="new-password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls}
            />
            {mismatch && <p className="mt-1 text-[12px] text-bad">Passwords don&rsquo;t match</p>}
          </div>
        </div>
        <ActionError error={error} />
        <button onClick={() => void submit()} disabled={!canSubmit} className={`${btnEmber} mt-4`}>
          {busy ? "Updating…" : "Update password"}
        </button>
        <AuditNote />
      </div>
    </Panel>
  );
}

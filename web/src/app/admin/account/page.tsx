import { Suspense } from "react";
import type { Metadata } from "next";
import { getSession } from "@/server/auth";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead } from "@/components/admin-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminEmailForm, AdminPasswordForm } from "@/components/admin-account-form";

/* Self-service login credentials for the signed-in Super Admin — the one
   place an admin updates their own email/password (never another
   account's). Gated the same way as every other /admin/* page: a null
   session (or non-admin role) renders AdminGate instead of the form. */

export const metadata: Metadata = { title: "Account" };

export default function AdminAccountPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminAccountContent />
    </Suspense>
  );
}

async function AdminAccountContent() {
  const session = await getSession();
  if (!session || session.role !== "admin") return <AdminGate />;

  return (
    <main>
      <AdminHead title="Account" sub="Your own login credentials" />
      <div className="grid gap-5 lg:max-w-[760px]">
        <AdminEmailForm currentEmail={session.email} />
        <AdminPasswordForm />
      </div>
    </main>
  );
}

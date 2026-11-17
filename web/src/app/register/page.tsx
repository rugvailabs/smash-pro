import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";

/* Buyer registration — Workflow H: organization created in pending status;
   approval is reviewed by Smash Pro (ADM-002). */

export const metadata: Metadata = { title: "Register your institution" };

export default function RegisterBuyerPage() {
  return (
    <main className="mx-auto max-w-[720px] px-4 pb-16 pt-10 md:px-10">
      <div className="mb-1 text-[13px] text-n600">
        <Link href="/" className="hover:underline">Home</Link> / <b className="text-ink">Register</b>
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[28px]">
        Register your institution
      </h1>
      <p className="mb-6 mt-1 max-w-[58ch] text-sm text-n600">
        Schools, academies, colleges and retailers. Your details are reviewed
        before ordering is enabled — institutional pricing appears on approval.{" "}
        <Link href="/register/supplier" className="font-semibold text-ember-deep hover:underline">
          Supplying instead?
        </Link>
      </p>
      <RegisterForm kind="buyer" />
    </main>
  );
}

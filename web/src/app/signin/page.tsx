import Link from "next/link";
import type { Metadata } from "next";
import { SignInForm } from "@/components/auth-forms";

/* Sign-in — first-party credential sessions (ADR-0004). */

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="mx-auto max-w-[560px] px-4 pb-16 pt-10 md:px-10">
      <div className="mb-1 text-[13px] text-n600">
        <Link href="/" className="hover:underline">Home</Link> / <b className="text-ink">Sign in</b>
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[28px]">Sign in</h1>
      <p className="mb-6 mt-1 text-sm text-n600">
        Approved institutions and suppliers sign in to their workspace.
      </p>
      <SignInForm />
    </main>
  );
}

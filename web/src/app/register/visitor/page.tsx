import Link from "next/link";
import type { Metadata } from "next";
import { VisitorRegisterForm } from "@/components/auth-forms";
import { Container } from "@/components/container";

/* Visitor buyer registration (ADR-0011) — no admin approval; account is
   active immediately. Distinct from the institutional buyer flow at
   /register, which still goes through review. */

export const metadata: Metadata = { title: "Quick sign-up" };

export default function RegisterVisitorPage() {
  return (
    <Container as="main" maxW="max-w-[560px]" className="pb-16 pt-10">
      <div className="mb-1 text-[13px] text-n600">
        <Link href="/" className="hover:underline">Home</Link> / <b className="text-ink">Quick sign-up</b>
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[28px]">
        Quick sign-up
      </h1>
      <p className="mb-6 mt-1 max-w-[58ch] text-sm text-n600">
        Just you, not an institution? Create an account and start ordering at
        standard pricing right away — no approval wait.{" "}
        <Link href="/register" className="font-semibold text-ember-deep hover:underline">
          Registering an institution instead?
        </Link>
      </p>
      <VisitorRegisterForm />
    </Container>
  );
}

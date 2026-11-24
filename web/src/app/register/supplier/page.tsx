import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";
import { Container } from "@/components/container";

/* Supplier registration — Workflow A: organization created in pending
   status; approval is reviewed by Smash Pro (ADM-001). */

export const metadata: Metadata = { title: "Register as a supplier" };

export default function RegisterSupplierPage() {
  return (
    <Container as="main" maxW="max-w-[720px]" className="pb-16 pt-10">
      <div className="mb-1 text-[13px] text-n600">
        <Link href="/" className="hover:underline">Home</Link> / <b className="text-ink">Register as a supplier</b>
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[28px]">
        Register as a supplier
      </h1>
      <p className="mb-6 mt-1 max-w-[58ch] text-sm text-n600">
        Manufacturers, wholesalers, distributors and dealers. After review you
        receive qualified institutional demand matched to your categories.{" "}
        <Link href="/register" className="font-semibold text-ember-deep hover:underline">
          Buying instead?
        </Link>
      </p>
      <RegisterForm kind="supplier" />
    </Container>
  );
}

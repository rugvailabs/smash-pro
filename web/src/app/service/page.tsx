import Link from "next/link";
import type { Metadata } from "next";
import { ServiceBookingForm } from "@/components/service-booking-form";
import { Container } from "@/components/container";

export const metadata: Metadata = { title: "Equipment Care & Repair" };

export default function ServicePage() {
  return (
    <main>
      <div className="border-b border-n200 bg-ink">
        <Container maxW="max-w-[920px]" className="py-14 text-center">
          <div className="mb-1 text-[13px] text-white/60">
            <Link href="/" className="hover:underline">Home</Link> / <span className="text-white/90">Equipment Care &amp; Repair</span>
          </div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-white md:text-[36px]">
            Equipment Care &amp; Repair
          </h1>
          <p className="mx-auto mt-3 max-w-[58ch] text-[15px] text-white/70">
            Bat knocking, racket restringing, crack repairs and more — inspected and quoted by
            Smash Pro before any work begins.
          </p>
        </Container>
      </div>

      <Container maxW="max-w-[920px]" className="py-10">
        <ServiceBookingForm />
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-wide text-n400">
          repair price: quotation after inspection · every submission is recorded (plt-003)
        </p>
      </Container>
    </main>
  );
}

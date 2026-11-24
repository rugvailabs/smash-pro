import type { Metadata } from "next";
import {
  SMASH_PRO_MAPS_LINK, SMASH_PRO_PHONE_DISPLAY, SMASH_PRO_PROFILE, SMASH_PRO_TEL_LINK, SMASH_PRO_WHATSAPP_LINK,
} from "@/lib/company-profile";

export const metadata: Metadata = { title: "Support" };

const TOPICS = [
  { q: "How does institutional pricing work?", a: "Standard prices are public. Once your institution registers and is approved, your applicable price appears on every product." },
  { q: "What payment methods are accepted?", a: "UPI, card, net banking, NEFT/RTGS and cheque. Orders dispatch once payment is confirmed — 100% advance, no credit facilities." },
  { q: "Who do I contact for bulk quantities or specifications?", a: "The sourcing team — use WhatsApp below for a quick response." },
  { q: "How do I track an order?", a: "Sign in and open My Orders for status and documents." },
];

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-14 md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Help centre</h1>
      <p className="mt-2 text-[14px] text-n600">Common questions from institutional buyers.</p>

      <div className="mt-8 divide-y divide-n200 border-y border-n200">
        {TOPICS.map((t) => (
          <details key={t.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-ink">
              {t.q}
              <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 fill-none stroke-n600 transition-transform group-open:rotate-180" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </summary>
            <p className="mt-2 text-[14px] text-n600">{t.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 rounded-[2px] border border-n200 bg-chalk p-5">
        <div className="font-display text-[15px] font-bold text-ink">Still need help?</div>
        <p className="mt-1 text-[13.5px] text-n600">Reach the sourcing team directly.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href={SMASH_PRO_WHATSAPP_LINK} target="_blank" rel="noopener" className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink">WhatsApp the team</a>
          <a href={SMASH_PRO_TEL_LINK} className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink">Call {SMASH_PRO_PHONE_DISPLAY}</a>
          <a href="/#how" className="inline-flex h-11 items-center rounded-[2px] border border-n400 bg-chalk px-4 text-sm font-semibold text-ink hover:border-ink">How ordering works</a>
        </div>
      </div>

      <div className="mt-6 rounded-[2px] border border-n200 bg-chalk p-5">
        <div className="font-display text-[15px] font-bold text-ink">Visit the store</div>
        <a
          href={SMASH_PRO_MAPS_LINK} target="_blank" rel="noopener"
          className="mt-1 block max-w-[52ch] text-[13.5px] text-n600 hover:text-ink hover:underline"
        >
          {SMASH_PRO_PROFILE.address}
        </a>
        <p className="mt-1 text-[13.5px] text-n600">{SMASH_PRO_PROFILE.hours}</p>
      </div>
    </main>
  );
}

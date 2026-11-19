"use client";

import { useState } from "react";
import Link from "next/link";

/* Buyer registration — form UI + client validation only. No submission,
   no backend. Success state is a local fixture confirmation screen. */

const ORG_TYPES = ["School", "College", "Sports Academy", "Retail Shop", "Other institution"];

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", orgType: ORG_TYPES[0], city: "", email: "", phone: "" });

  if (submitted) {
    return (
      <main className="mx-auto max-w-[520px] px-4 py-16 text-center md:px-10">
        <svg viewBox="0 0 24 24" aria-hidden className="mx-auto h-12 w-12 fill-none stroke-ok" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M8 12.5l2.5 2.5L16 9" /></svg>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">Registration submitted</h1>
        <p className="mt-2 text-[14px] text-n600">This is a UI preview — no application was actually created. In the real platform, your institution&rsquo;s details would now be reviewed before ordering is enabled.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press">Back to homepage</Link>
      </main>
    );
  }

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <main className="mx-auto max-w-[560px] px-4 py-14 md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Register your institution</h1>
      <p className="mt-2 text-[14px] text-n600">Preview form — nothing is submitted to a backend.</p>
      <form
        className="mt-7 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const next: Record<string, string> = {};
          if (!form.name.trim()) next.name = "Institution name is required.";
          if (!form.city.trim()) next.city = "City is required.";
          if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
          if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) next.phone = "Enter a 10-digit phone number.";
          setErrors(next);
          if (Object.keys(next).length === 0) setSubmitted(true);
        }}
      >
        {[
          { k: "name" as const, label: "Institution name", type: "text" },
          { k: "city" as const, label: "City", type: "text" },
          { k: "email" as const, label: "Email", type: "email" },
          { k: "phone" as const, label: "Phone", type: "tel" },
        ].map(({ k, label, type }) => (
          <div key={k}>
            <label htmlFor={k} className="mb-1.5 block text-[13px] font-medium text-ink">{label}</label>
            <input id={k} type={type} value={form[k]} onChange={(e) => set(k, e.target.value)} className={"h-11 w-full rounded-[2px] border bg-chalk px-3 text-sm focus:outline-none " + (errors[k] ? "border-bad" : "border-n400 focus:border-ink")} />
            {errors[k] && <p className="mt-1 text-[12.5px] font-medium text-bad">{errors[k]}</p>}
          </div>
        ))}
        <div>
          <label htmlFor="orgType" className="mb-1.5 block text-[13px] font-medium text-ink">Organisation type</label>
          <select id="orgType" value={form.orgType} onChange={(e) => set("orgType", e.target.value)} className="h-11 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm focus:border-ink focus:outline-none">
            {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button className="flex h-12 w-full items-center justify-center rounded-[2px] bg-ember-deep text-sm font-semibold text-white transition-colors hover:bg-ember-press">Submit registration</button>
      </form>
    </main>
  );
}

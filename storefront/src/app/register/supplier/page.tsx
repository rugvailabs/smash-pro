"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterSupplierPage() {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ company: "", category: "Manufacturer", email: "" });

  if (submitted) {
    return (
      <main className="mx-auto max-w-[520px] px-4 py-16 text-center md:px-10">
        <svg viewBox="0 0 24 24" aria-hidden className="mx-auto h-12 w-12 fill-none stroke-ok" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M8 12.5l2.5 2.5L16 9" /></svg>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">Registration submitted</h1>
        <p className="mt-2 text-[14px] text-n600">UI preview only — no application was created.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-[2px] bg-ember-deep px-5 text-sm font-semibold text-white transition-colors hover:bg-ember-press">Back to homepage</Link>
      </main>
    );
  }
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <main className="mx-auto max-w-[560px] px-4 py-14 md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Register as a supplier</h1>
      <p className="mt-2 text-[14px] text-n600">Preview form — nothing is submitted to a backend.</p>
      <form
        className="mt-7 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const next: Record<string, string> = {};
          if (!form.company.trim()) next.company = "Company name is required.";
          if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
          setErrors(next);
          if (Object.keys(next).length === 0) setSubmitted(true);
        }}
      >
        <div>
          <label htmlFor="company" className="mb-1.5 block text-[13px] font-medium text-ink">Company name</label>
          <input id="company" value={form.company} onChange={(e) => set("company", e.target.value)} className={"h-11 w-full rounded-[2px] border bg-chalk px-3 text-sm focus:outline-none " + (errors.company ? "border-bad" : "border-n400 focus:border-ink")} />
          {errors.company && <p className="mt-1 text-[12.5px] font-medium text-bad">{errors.company}</p>}
        </div>
        <div>
          <label htmlFor="category" className="mb-1.5 block text-[13px] font-medium text-ink">Category</label>
          <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className="h-11 w-full rounded-[2px] border border-n400 bg-chalk px-3 text-sm focus:border-ink focus:outline-none">
            {["Manufacturer", "Wholesaler", "Distributor", "Dealer"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={"h-11 w-full rounded-[2px] border bg-chalk px-3 text-sm focus:outline-none " + (errors.email ? "border-bad" : "border-n400 focus:border-ink")} />
          {errors.email && <p className="mt-1 text-[12.5px] font-medium text-bad">{errors.email}</p>}
        </div>
        <button className="flex h-12 w-full items-center justify-center rounded-[2px] bg-ember-deep text-sm font-semibold text-white transition-colors hover:bg-ember-press">Submit registration</button>
      </form>
    </main>
  );
}

export default function PoliciesPage() {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-14 md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[33px]">Policies</h1>
      <p className="mt-2 text-[14px] text-n600">
        Placeholder structure only — final institutional terms, GST/tax documentation and
        return/replacement policy are pending owner and tax-professional approval (see
        OPEN-BUSINESS-DECISIONS.md in the main project). Nothing on this page is a confirmed policy.
      </p>
      <div className="mt-6 space-y-5 text-[14px] text-n700">
        <section>
          <h2 className="font-display text-base font-semibold text-ink">Payment</h2>
          <p className="mt-1 text-n600">100% advance payment before dispatch. No postpaid or credit facilities.</p>
        </section>
        <section>
          <h2 className="font-display text-base font-semibold text-ink">Terms &amp; Privacy</h2>
          <p className="mt-1 text-n600">Full terms-of-service and privacy-policy content is not yet drafted for this preview.</p>
        </section>
      </div>
    </main>
  );
}

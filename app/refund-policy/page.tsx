import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-24 text-zinc-300">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Angel Beauty Studio</Link>
        <h1 className="mt-8 font-display text-5xl font-light text-white">Refund Policy</h1>
        <p className="mt-4 text-sm text-zinc-500">Last updated: October 6, 2026</p>
        <div className="mt-12 space-y-8 text-sm leading-7">
          <section><h2 className="mb-3 text-xl text-white">No online payments at this time</h2><p>Angel Beauty Studio currently uses this website to schedule appointments only. We do not currently collect deposits or payments through the website, so there are no online booking charges or online refunds to process.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Appointment changes</h2><p>To cancel or change an appointment, contact the studio at 747 334 9000 as early as possible. Any future deposits, cancellation charges, or service adjustments will be explained before payment is requested and will be governed by the policy provided at that time.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Service concerns</h2><p>If you have a concern about a service received in the studio, please contact us directly so we can review it with you.</p></section>
        </div>
      </article>
    </main>
  );
}

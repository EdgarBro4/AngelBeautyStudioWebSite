import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-24 text-zinc-300">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Angel Beauty Studio</Link>
        <h1 className="mt-8 font-display text-5xl font-light text-white">Terms of Service</h1>
        <p className="mt-4 text-sm text-zinc-500">Last updated: October 6, 2026</p>
        <div className="mt-12 space-y-8 text-sm leading-7">
          <section><h2 className="mb-3 text-xl text-white">Using this website</h2><p>This website provides information about Angel Beauty Studio and allows visitors to request and confirm appointments. Please provide accurate information and use the website only for lawful purposes.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Appointments</h2><p>An appointment is confirmed only after the booking process is completed successfully. Availability can change, and the studio may contact you if an appointment needs to be adjusted. Please arrive on time and contact the studio as early as possible if you need to change your appointment.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Text messages</h2><p>By providing your phone number during booking, you agree to receive appointment verification and service-related text messages. Message frequency varies. Message and data rates may apply. You can contact the studio with questions about these messages.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Website content</h2><p>Website content is provided for general information and may change without notice. We try to keep information accurate, but we do not guarantee that the website will always be available or error-free.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Contact</h2><p>Questions about these terms can be directed to Angel Beauty Studio at 747 334 9000.</p></section>
        </div>
      </article>
    </main>
  );
}

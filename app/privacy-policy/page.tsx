import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-24 text-zinc-300">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Angel Beauty Studio</Link>
        <h1 className="mt-8 font-display text-5xl font-light text-white">Privacy Policy</h1>
        <p className="mt-4 text-sm text-zinc-500">Last updated: October 6, 2026</p>
        <div className="mt-12 space-y-8 text-sm leading-7">
          <section><h2 className="mb-3 text-xl text-white">Information we collect</h2><p>When you book an appointment, we collect your name, phone number, selected service, stylist, date, and time. We also receive technical information needed to operate and secure the website, such as browser and device details.</p></section>
          <section><h2 className="mb-3 text-xl text-white">How we use information</h2><p>We use booking details to schedule and manage appointments, send verification and appointment-related text messages, prevent abuse, respond to inquiries, and operate and improve the website. We do not sell personal information.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Service providers</h2><p>We use Supabase to store booking information and Cloudflare Turnstile to help protect booking forms from automated abuse. Text-message delivery may be handled by a messaging provider. These providers process information only as needed to provide their services.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Your choices</h2><p>You may contact the studio to ask about the personal information associated with your appointment or to request correction or deletion where applicable. You can also block cookies in your browser, although parts of the site may not work correctly.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Contact</h2><p>For privacy questions, contact Angel Beauty Studio at 747 334 9000 or visit us at 5112 Hollywood Blvd Unit 110, Los Angeles, CA 90027.</p></section>
        </div>
      </article>
    </main>
  );
}

import Link from 'next/link';

export default function CookiesPolicyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-24 text-zinc-300">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Angel Beauty Studio</Link>
        <h1 className="mt-8 font-display text-5xl font-light text-white">Cookies Policy</h1>
        <p className="mt-4 text-sm text-zinc-500">Last updated: October 6, 2026</p>
        <div className="mt-12 space-y-8 text-sm leading-7">
          <section><h2 className="mb-3 text-xl text-white">What we use</h2><p>This website uses essential browser storage to remember that you have dismissed the cookie notice. The site does not currently use advertising cookies or analytics tracking.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Third-party services</h2><p>The booking page loads Cloudflare Turnstile to protect the form from automated abuse. Cloudflare may use cookies or similar technologies under its own privacy practices. Links to Google Maps, Apple Maps, and Instagram open third-party websites with their own policies.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Managing cookies</h2><p>You can delete or block cookies and local browser storage through your browser settings. Blocking essential storage may cause the cookie notice to appear again and may affect parts of the booking experience.</p></section>
          <section><h2 className="mb-3 text-xl text-white">Contact</h2><p>For questions about this policy, contact Angel Beauty Studio at 747 334 9000.</p></section>
        </div>
      </article>
    </main>
  );
}

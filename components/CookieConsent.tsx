'use client';

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'angel-beauty-cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(CONSENT_KEY) !== 'accepted');
  }, []);

  function acceptCookies() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      role="dialog"
      aria-label="Cookie notice"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl border border-zinc-700 bg-zinc-900/95 p-5 shadow-2xl backdrop-blur-md sm:inset-x-6 sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h2 className="mb-2 text-sm font-medium text-white">We use cookies and similar technologies</h2>
          <p className="text-xs leading-relaxed text-zinc-400">
            Angel Beauty Studio uses essential storage to keep this website working and protect appointment forms. Third-party services may process limited technical data when you use booking verification or external links. Read our{' '}
            <a href="/cookies-policy" className="text-[#D4AF37] underline underline-offset-4">Cookies Policy</a>{' '}
            and <a href="/privacy-policy" className="text-[#D4AF37] underline underline-offset-4">Privacy Policy</a>.
          </p>
        </div>
        <button
          type="button"
          onClick={acceptCookies}
          className="shrink-0 bg-[#D4AF37] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-950 transition-colors hover:bg-[#F0D060]"
        >
          Accept
        </button>
      </div>
    </aside>
  );
}

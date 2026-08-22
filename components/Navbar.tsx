'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'theme';

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
}

export default function Navbar() {
  const [scrollY, setScrollY] = useState(0);
  const [open, setOpen] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const light = stored === 'light';
    setIsLight(light);
    applyTheme(light ? 'light' : 'dark');
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrolled = scrollY > 60;
  // 0 at top → 1 after 200px of scroll
  const scrollRatio = Math.min(scrollY / 200, 1);

  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    const theme: 'light' | 'dark' = next ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }

  const links = [
    { label: 'Services', href: '#services' },
    { label: 'Reviews', href: '#team' },
    { label: 'Book Now', href: '/book', highlight: true },
  ];

  const navBg = !mounted
    ? 'rgba(9,9,11,0)'
    : isLight
    ? `rgba(248,245,239,${(scrollRatio * 0.92).toFixed(2)})`
    : `rgba(9,9,11,${(scrollRatio * 0.85).toFixed(2)})`;

  const borderColor = !mounted
    ? 'transparent'
    : isLight
    ? `rgba(164,130,30,${(scrollRatio * 0.18).toFixed(2)})`
    : `rgba(39,39,42,${(scrollRatio * 0.60).toFixed(2)})`;

  const linkColor    = mounted && isLight ? '#3a3a3a' : '#e4e4e7';
  const menuBtnColor = mounted && isLight ? '#5a5a5a' : '#a1a1aa';

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 border-b ${scrolled ? 'backdrop-blur-md' : ''}`}
      style={{ backgroundColor: navBg, borderBottomColor: borderColor }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between" style={{ height: '72px' }}>
        <Link href="/" className="flex items-center">
          <img
            src="/BAS.svg"
            alt="Angel Beauty Studio"
            className="h-14 w-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.4))' }}
          />
        </Link>

        <ul className="hidden md:flex items-center gap-10">
          {links.map((l) =>
            l.highlight ? (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="px-7 py-2.5 text-xs tracking-[0.25em] uppercase font-semibold text-zinc-950 rounded-sm transition-all duration-300 hover:scale-105 shadow-md hover:shadow-[#D4AF37]/30"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
                >
                  {l.label}
                </Link>
              </li>
            ) : (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="text-xs tracking-[0.25em] uppercase font-medium hover:text-[#D4AF37] transition-colors duration-200"
                  style={{ color: linkColor }}
                >
                  {l.label}
                </a>
              </li>
            )
          )}

          <li>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#D4AF37]/10"
              style={{ border: `1px solid ${mounted && isLight ? 'rgba(164,130,30,0.35)' : 'rgba(63,63,70,1)'}` }}
              aria-label="Toggle theme"
            >
              {mounted && isLight
                ? <Moon className="w-4 h-4" style={{ color: '#5a5a5a' }} />
                : <Sun  className="w-4 h-4 text-[#D4AF37]" />}
            </button>
          </li>
        </ul>

        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
            style={{ border: `1px solid ${mounted && isLight ? 'rgba(164,130,30,0.35)' : 'rgba(63,63,70,1)'}` }}
            aria-label="Toggle theme"
          >
            {mounted && isLight
              ? <Moon className="w-4 h-4" style={{ color: '#5a5a5a' }} />
              : <Sun  className="w-4 h-4 text-[#D4AF37]" />}
          </button>
          <button
            className="transition-colors hover:text-[#D4AF37]"
            style={{ color: menuBtnColor }}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="md:hidden backdrop-blur-sm border-t px-6 py-8 flex flex-col gap-6"
          style={{
            backgroundColor: mounted && isLight ? 'rgba(248,245,239,0.99)' : 'rgba(9,9,11,0.98)',
            borderTopColor: borderColor,
          }}
        >
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm tracking-[0.2em] uppercase transition-colors hover:text-[#D4AF37]"
              style={{ color: l.highlight ? '#D4AF37' : menuBtnColor }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { Instagram, Phone, MapPin, Clock } from 'lucide-react';

const ADDRESS = '5112 Hollywood Blvd Unit 110, Los Angeles, CA 90027';
const ENCODED = encodeURIComponent(ADDRESS);

function openMaps() {
  const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  const url = isApple
    ? `https://maps.apple.com/?q=${ENCODED}`
    : `https://www.google.com/maps/search/?api=1&query=${ENCODED}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-950 pt-20 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-5">
              <img
                src="/BAS.svg"
                alt="Angel Beauty Studio"
                className="h-14 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.15))' }}
              />
            </div>
            <p className="text-zinc-500 text-sm font-light leading-relaxed mb-6">
              Luxury beauty services crafted with artistry and precision in an elevated studio setting.
            </p>
            <a
              href="https://instagram.com/beauty_angel_studio1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-[#D4AF37] transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-6">Services</h4>
            <ul className="space-y-3 text-sm text-zinc-500 font-light">
              {["Women's Haircut", "Balayage / Ombré", "Men's Service", "Makeup", "Nail Service", "Lash & Brow"].map((s) => (
                <li key={s}>
                  <Link href="/book" className="hover:text-zinc-200 transition-colors">{s}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Studio */}
          <div>
            <h4 className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-6">Studio</h4>
            <ul className="space-y-3 text-sm text-zinc-500 font-light">
              <li><Link href="/book" className="hover:text-zinc-200 transition-colors">Book Appointment</Link></li>
              <li><Link href="#team" className="hover:text-zinc-200 transition-colors">Reviews</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-zinc-200 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-zinc-200 transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies-policy" className="hover:text-zinc-200 transition-colors">Cookies Policy</Link></li>
              <li><Link href="/refund-policy" className="hover:text-zinc-200 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-zinc-500 font-light">
              <li className="flex gap-3 items-start">
                <MapPin className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                <button
                  onClick={openMaps}
                  className="text-left hover:text-zinc-200 transition-colors cursor-pointer underline-offset-2 hover:underline"
                >
                  5112 Hollywood Blvd Unit 110<br />Los Angeles, CA 90027
                </button>
              </li>
              <li className="flex gap-3 items-center">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href="tel:+17473349000" className="hover:text-zinc-200 transition-colors">747 334 9000</a>
              </li>
              <li className="flex gap-3 items-center">
                <Instagram className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a
                  href="https://instagram.com/beauty_angel_studio1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zinc-200 transition-colors"
                >
                  @beauty_angel_studio1
                </a>
              </li>
              <li className="flex gap-3 items-start">
                <Clock className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                <span>Mon – Sat: 9am – 8pm<br />Sun: 10am – 6pm</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-600 font-light">
            &copy; {new Date().getFullYear()} Angel Beauty Studio. All rights reserved.
          </p>
          <p className="text-xs text-zinc-700 font-light">
            Los Angeles, CA &nbsp;
            <Link href="/admin" className="text-zinc-800 hover:text-zinc-700 transition-colors">✦</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

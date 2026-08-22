'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ChevronRight } from 'lucide-react';
import { supabase, type Service } from '@/lib/supabase';
import Link from 'next/link';

type Props = {
  categoryTitle: string;
  serviceType: string;
  onClose: () => void;
};

export default function ServicesModal({ categoryTitle, serviceType, onClose }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('services')
      .select('*')
      .eq('type', serviceType)
      .order('price', { ascending: true })
      .then(({ data }) => {
        if (data) setServices(data);
        setLoading(false);
      });
  }, [serviceType]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-sm z-10 overflow-hidden"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <p className="text-xs tracking-[0.4em] text-[#D4AF37] uppercase mb-1">Our Services</p>
            <h3 className="font-display text-2xl font-light text-white">{categoryTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-zinc-800 rounded-sm animate-pulse" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-10">No services available.</p>
          ) : (
            <div className="space-y-2">
              {services.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="flex items-center justify-between p-4 border border-zinc-800 rounded-sm bg-zinc-950/40 hover:border-[#D4AF37]/30 transition-colors group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-white text-sm font-medium">{s.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      <span className="text-xs text-zinc-500">{s.duration} min</span>
                      {s.description && (
                        <span className="text-xs text-zinc-600 truncate ml-1">&mdash; {s.description}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-display text-lg text-[#D4AF37] shrink-0">${s.price}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-6 border-t border-zinc-800">
          <Link
            href="/book"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-sm tracking-[0.2em] uppercase font-medium text-zinc-950 rounded-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
          >
            Book Now
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

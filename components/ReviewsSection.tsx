'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { supabase, type Review } from '@/lib/supabase';

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-zinc-700'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<(Review & { workers: { name: string; role: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      const { data } = await supabase
        .from('reviews')
        .select('*, workers(name, role)')
        .order('created_at', { ascending: false })
        .limit(8);
      if (data) setReviews(data as any);
      setLoading(false);
    }
    fetchReviews();
  }, []);

  return (
    <section id="reviews" className="py-32 px-6 bg-zinc-900/20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs tracking-[0.5em] text-[#D4AF37] uppercase mb-4">Client Stories</p>
          <h2 className="font-display text-5xl md:text-6xl font-light text-white mb-6">What They Say</h2>
          <div className="w-16 h-px bg-[#D4AF37] mx-auto" />
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-8 border border-zinc-800 rounded-sm bg-zinc-900/40 animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-4" />
                <div className="h-16 bg-zinc-800 rounded mb-4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                className="relative p-8 border border-zinc-800 rounded-sm bg-zinc-900/40 hover:border-[#D4AF37]/40 transition-all duration-500 group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
              >
                <Quote className="absolute top-6 right-6 w-8 h-8 text-[#D4AF37]/10 group-hover:text-[#D4AF37]/20 transition-colors" />
                <StarRow rating={review.rating} />
                <p className="mt-5 text-zinc-300 text-sm leading-relaxed font-light italic">
                  &ldquo;{review.feedback}&rdquo;
                </p>
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <p className="text-white text-sm font-medium">{review.customer_name}</p>
                  {review.workers && (
                    <p className="text-xs text-[#D4AF37] tracking-widest uppercase mt-1">
                      Reviewed {review.workers.name}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, Check, MessageSquare, AlertTriangle } from 'lucide-react';
import { supabase, type Worker, type Review } from '@/lib/supabase';

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i + 1)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i + 1)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              i < (hovered || value) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-zinc-700'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-zinc-700'}`} />
      ))}
    </div>
  );
}

type Mode = 'menu' | 'read' | 'write';

type Props = {
  worker: Worker;
  onClose: () => void;
  initialMode?: 'read' | 'write';
};

export default function WorkerReviewModal({ worker, onClose, initialMode }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode ?? 'menu');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // form state
  const [rating, setRating] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inappropriateError, setInappropriateError] = useState(false);

  const avg = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    if (mode !== 'read') return;
    setLoadingReviews(true);
    supabase
      .from('reviews')
      .select('*')
      .eq('worker_id', worker.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setReviews(data);
        setLoadingReviews(false);
      });
  }, [mode, worker.id]);

  // also load reviews count for menu
  useEffect(() => {
    supabase
      .from('reviews')
      .select('*')
      .eq('worker_id', worker.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setReviews(data);
      });
  }, [worker.id]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || rating === 0) return;

    const BLOCKED = ['fuck','shit','bitch','ass','cunt','dick','cock','pussy','asshole','motherfuck','nigger','faggot','whore','slut','bastard','damn','crap','wtf','fag','retard','idiot','stupid','dumb','hate'];
    const combined = (customerName + ' ' + feedback).toLowerCase();
    const found = BLOCKED.find((w) => combined.includes(w));
    if (found) {
      setSubmitting(false);
      setInappropriateError(true);
      return;
    }

    setInappropriateError(false);

    setSubmitting(true);
    await supabase.from('reviews').insert({
      worker_id: worker.id,
      rating,
      customer_name: customerName.trim(),
      feedback: feedback.trim() || null,
    });
    setSubmitting(false);
    setSubmitted(true);
    // Refresh reviews list
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('worker_id', worker.id)
      .order('created_at', { ascending: false });
    if (data) setReviews(data);
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-sm z-10 overflow-hidden"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-zinc-800">
          <img
            src={worker.image_url || ''}
            alt={worker.name}
            className="w-12 h-12 rounded-full object-cover border border-zinc-700 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium">{worker.name}</h3>
            <p className="text-xs text-[#D4AF37] tracking-widest uppercase mt-0.5">{worker.role}</p>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <StarRow rating={Math.round(avg)} />
                <span className="text-xs text-zinc-500">{avg.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* MENU */}
            {mode === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <button
                  onClick={() => setMode('read')}
                  className="w-full flex items-center gap-4 p-4 border border-zinc-700 rounded-sm hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 transition-all duration-200 text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
                    <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Read Reviews</p>
                    <p className="text-zinc-500 text-xs">
                      {reviews.length > 0 ? `${reviews.length} review${reviews.length !== 1 ? 's' : ''} from clients` : 'No reviews yet'}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('write')}
                  className="w-full flex items-center gap-4 p-4 border border-zinc-700 rounded-sm hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 transition-all duration-200 text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
                    <Star className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Leave a Review</p>
                    <p className="text-zinc-500 text-xs">Share your experience with {worker.name}</p>
                  </div>
                </button>
              </motion.div>
            )}

            {/* READ REVIEWS */}
            {mode === 'read' && (
              <motion.div key="read" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <button
                  onClick={() => setMode('menu')}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-5 flex items-center gap-1"
                >
                  ← Back
                </button>
                <h4 className="text-xs tracking-[0.4em] text-[#D4AF37] uppercase mb-4">
                  {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
                </h4>
                {loadingReviews ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-20 bg-zinc-800 rounded-sm animate-pulse" />
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-10">
                    <Star className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                    <p className="text-zinc-500 text-sm">No reviews yet.</p>
                    <button
                      onClick={() => setMode('write')}
                      className="mt-4 text-xs text-[#D4AF37] hover:text-[#F0D060] transition-colors"
                    >
                      Be the first to review {worker.name}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="p-4 border border-zinc-800 rounded-sm bg-zinc-950/40">
                        <div className="flex items-center justify-between mb-2">
                          <StarRow rating={r.rating} />
                          <span className="text-xs text-zinc-600">
                            {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {r.feedback && (
                          <p className="text-zinc-300 text-sm font-light italic leading-relaxed mb-2">
                            &ldquo;{r.feedback}&rdquo;
                          </p>
                        )}
                        <p className="text-xs text-zinc-500">{r.customer_name}</p>
                      </div>
                    ))}
                    <button
                      onClick={() => setMode('write')}
                      className="w-full py-3 border border-dashed border-zinc-700 rounded-sm text-xs text-[#D4AF37] hover:border-[#D4AF37]/60 transition-colors"
                    >
                      + Leave your own review
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* WRITE REVIEW */}
            {mode === 'write' && (
              <motion.div key="write" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                {!submitted ? (
                  <>
                    <button
                      onClick={() => setMode('menu')}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-5 flex items-center gap-1"
                    >
                      ← Back
                    </button>
                    <h4 className="text-xs tracking-[0.4em] text-[#D4AF37] uppercase mb-6">Your Review</h4>
                    <form onSubmit={submitReview} className="space-y-5">
                      <div>
                        <label className="block text-xs tracking-[0.3em] text-zinc-400 uppercase mb-3">Rating</label>
                        <StarPicker value={rating} onChange={setRating} />
                      </div>
                      <div>
                        <label className="block text-xs tracking-[0.3em] text-zinc-400 uppercase mb-2">Your Name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => { setCustomerName(e.target.value); setInappropriateError(false); }}
                          placeholder="e.g. Jessica M."
                          required
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-sm px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] text-sm transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs tracking-[0.3em] text-zinc-400 uppercase mb-2">Your Review</label>
                        <textarea
                          value={feedback}
                          onChange={(e) => { setFeedback(e.target.value); setInappropriateError(false); }}
                          rows={3}
                          placeholder="Tell us about your experience..."
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-sm px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] text-sm resize-none transition-colors"
                        />
                      </div>
                      {inappropriateError && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3 px-4 py-3 rounded-sm border border-red-900/60 bg-red-950/30"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-300 font-light leading-snug">
                            Your review contains inappropriate language. Please revise it before submitting.
                          </p>
                        </motion.div>
                      )}
                      <button
                        type="submit"
                        disabled={submitting || rating === 0 || !customerName.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm tracking-[0.2em] uppercase font-medium text-zinc-950 rounded-sm disabled:opacity-40 transition-all hover:scale-[1.02]"
                        style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
                      >
                        <Send className="w-4 h-4" />
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                      style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
                    >
                      <Check className="w-8 h-8 text-zinc-950" />
                    </div>
                    <h3 className="font-display text-2xl text-white mb-2">Thank You!</h3>
                    <p className="text-zinc-400 text-sm font-light mb-6">Your review has been posted.</p>
                    <button
                      onClick={() => setMode('read')}
                      className="text-xs text-[#D4AF37] hover:text-[#F0D060] transition-colors"
                    >
                      Read all reviews →
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

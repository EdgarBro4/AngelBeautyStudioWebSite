'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, type Variants } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown, Sparkles, MessageSquare, Star, ChevronRight } from 'lucide-react';
import WorkerReviewModal from '@/components/WorkerReviewModal';
import ServicesModal from '@/components/ServicesModal';
import { supabase, type Worker, type Review } from '@/lib/supabase';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
      {children}
    </motion.div>
  );
}

function FadeItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} variants={fadeUp}>{children}</motion.div>;
}

export function HeroSection() {
  return (
    <section className="relative bg-zinc-950 flex items-center justify-center py-10 md:py-16">
      {/* Ambient gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 65% at 50% 52%, rgba(212,175,55,0.06) 0%, rgba(180,140,30,0.03) 40%, transparent 70%)',
        }}
      />

      {/* Floating card — constrained so the image always fits fully on screen */}
      <div
        className="relative rounded-[2rem] overflow-hidden"
        style={{
          /* min(85vw, 85vh × image-aspect-ratio) — image is 3:2, so 85vh × 1.5 */
          width: 'min(92vw, calc(82vh * 1.5))',
          boxShadow:
            '0px 60px 160px -20px rgba(0,0,0,0.95), 0px 0px 100px -10px rgba(212,175,55,0.08)',
        }}
      >
        <img
          src="/images/768A63CD-73D6-44F0-9E14-2F89D9103B3B.PNG"
          alt="Angel Beauty Studio"
          className="w-full h-auto block"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-zinc-950/40 pointer-events-none" />
      </div>
    </section>
  );
}

export function ServicesHighlight() {
  const [activeModal, setActiveModal] = useState<{ title: string; type: string } | null>(null);

  const services = [
    { title: 'Manicure', type: 'Manicure', desc: 'Classic manicures, gel finishes, nail art, and repairs.' },
    { title: 'Gel-X', type: 'Gel-X', desc: 'Full-cover gel extensions with polished, lasting results.' },
    { title: 'Pedicure', type: 'Pedicure', desc: 'Relaxing pedicures with regular or gel polish options.' },
    { title: 'Full Hair Services', type: 'Full Hair Services', desc: 'Cuts, blowouts, color, styling, treatments, and bridal hair.' },
    { title: 'Barber Services', type: 'Barber Services', desc: 'Precision cuts, fades, beard grooming, and finishing.' },
    { title: 'Brows & Lashes', type: 'Brows & Lashes', desc: 'Waxing, threading, tinting, lamination, and lash lifting.' },
    { title: 'Makeup Services', type: 'Makeup Services', desc: 'Natural, glam, special occasion, and bridal makeup.' },
  ];

  return (
    <section id="services" className="py-32 px-6 max-w-7xl mx-auto">
      <AnimatedSection>
        <FadeItem className="text-center mb-20">
          <p className="text-xs tracking-[0.5em] text-[#D4AF37] uppercase mb-4">What We Offer</p>
          <h2 className="font-display text-5xl md:text-6xl font-light text-white mb-6">Our Services</h2>
          <div className="w-16 h-px bg-[#D4AF37] mx-auto mb-4" />
          <p className="text-zinc-500 text-sm font-light">Tap a category to see all services &amp; pricing</p>
        </FadeItem>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => (
            <FadeItem key={s.title}>
              <button
                onClick={() => setActiveModal({ title: s.title, type: s.type })}
                className="service-card group p-8 border border-zinc-800 rounded-sm bg-zinc-900/40 transition-all duration-500 cursor-pointer h-full w-full text-left"
              >
                <div className="flex items-center gap-3 mb-6">
                  <img src="/images/services/Wing.png" alt="" className="h-8 w-auto" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.4))' }} />
                  <h3 className="font-display text-xl text-white">{s.title}</h3>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed font-light mb-4">{s.desc}</p>
                <div className="flex items-center gap-1 text-xs text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View services</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
                <div className="mt-3 w-8 h-px bg-[#D4AF37]/40 group-hover:w-full group-hover:bg-[#D4AF37] transition-all duration-500" />
              </button>
            </FadeItem>
          ))}
        </div>
      </AnimatedSection>

      <AnimatePresence>
        {activeModal && (
          <ServicesModal
            categoryTitle={activeModal.title}
            serviceType={activeModal.type}
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

export function TeamPreview() {
  const [team, setTeam] = useState<Worker[]>([]);
  const [reviewMap, setReviewMap] = useState<Record<string, Review[]>>({});
  const [modalWorker, setModalWorker] = useState<Worker | null>(null);
  const [modalMode, setModalMode] = useState<'read' | 'write' | null>(null);

  useEffect(() => {
    supabase.from('workers').select('*').order('name').then(({ data }) => { if (data) setTeam(data); });
    supabase.from('reviews').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (!data) return;
      const map: Record<string, Review[]> = {};
      data.forEach((r) => { if (!map[r.worker_id]) map[r.worker_id] = []; map[r.worker_id].push(r); });
      setReviewMap(map);
    });
  }, []);

  function calcRating(workerId: string) {
    const rs = reviewMap[workerId] || [];
    if (!rs.length) return null;
    return (rs.reduce((a, r) => a + r.rating, 0) / rs.length).toFixed(1);
  }

  function openReviews(w: Worker) { setModalWorker(w); setModalMode('read'); }
  function openLeaveReview(w: Worker) { setModalWorker(w); setModalMode('write'); }

  function WorkerAvatar({ worker }: { worker: Worker }) {
    if (worker.image_url) {
      return <img src={worker.image_url} alt={worker.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />;
    }
    const initials = worker.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
        <span className="font-display text-5xl text-zinc-600">{initials}</span>
      </div>
    );
  }

  return (
    <section id="team" className="py-32 px-6 max-w-7xl mx-auto">
      <AnimatedSection>
        <FadeItem className="text-center mb-20">
          <p className="text-xs tracking-[0.5em] text-[#D4AF37] uppercase mb-4">The Artists</p>
          <h2 className="font-display text-5xl md:text-6xl font-light text-white mb-6">Our Team</h2>
          <div className="w-16 h-px bg-[#D4AF37] mx-auto" />
        </FadeItem>

        {team.length === 0 ? (
          <FadeItem>
            <div className="text-center py-20 text-zinc-600">
              <p className="text-sm">Our team will be featured here soon.</p>
            </div>
          </FadeItem>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => {
              const rating = calcRating(member.id);
              const reviewCount = (reviewMap[member.id] || []).length;
              return (
                <FadeItem key={member.id}>
                  <div className="worker-card group border border-zinc-800 rounded-sm overflow-hidden bg-zinc-900/40 transition-all duration-500 flex flex-col">
                    <div className="aspect-[3/4] overflow-hidden relative">
                      <WorkerAvatar worker={member} />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-display text-lg text-white">{member.name}</h3>
                      <p className="text-xs text-[#D4AF37] tracking-widest uppercase mt-1 mb-1">{member.role}</p>
                      {rating && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                          <span className="text-xs text-zinc-400">{rating} ({reviewCount})</span>
                        </div>
                      )}
                      <p className="text-zinc-500 text-xs font-light leading-relaxed mb-5 flex-1">{member.bio}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openReviews(member)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-zinc-700 rounded-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-all duration-200"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Reviews
                        </button>
                        <button
                          onClick={() => openLeaveReview(member)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-[#D4AF37]/40 rounded-sm text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all duration-200"
                        >
                          <Star className="w-3 h-3" />
                          Rate
                        </button>
                      </div>
                    </div>
                  </div>
                </FadeItem>
              );
            })}
          </div>
        )}
      </AnimatedSection>

      <AnimatePresence>
        {modalWorker && modalMode && (
          <WorkerReviewModal
            worker={modalWorker}
            initialMode={modalMode}
            onClose={() => { setModalWorker(null); setModalMode(null); }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

export function StatsSection() {
  const stats = [
    { value: '2,400+', label: 'Happy Clients' },
    { value: '12', label: 'Years of Excellence' },
    { value: '4.9', label: 'Average Rating' },
  ];
  return (
    <section className="py-24 border-y border-zinc-800/50 bg-zinc-900/20">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-12">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
          >
            <p className="font-display text-4xl md:text-5xl gold-text mb-2">{s.value}</p>
            <p className="text-xs text-zinc-500 tracking-widest uppercase">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function BookingCTA() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/50 to-zinc-950" />
      <div className="relative max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Sparkles className="w-8 h-8 mx-auto text-[#D4AF37] mb-8" />
          <h2 className="font-display text-5xl md:text-6xl font-light text-white mb-6">
            Ready for Your <span className="gold-text">Transformation?</span>
          </h2>
          <p className="text-zinc-400 text-lg font-light mb-12 leading-relaxed">
            Reserve your appointment in minutes. Select your service, choose your artist, and let us take care of the rest.
          </p>
          <Link
            href="/book"
            className="inline-block px-14 py-5 text-sm tracking-[0.25em] uppercase font-medium text-zinc-950 rounded-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
          >
            Book Your Appointment
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

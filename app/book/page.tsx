'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Clock, Star, Phone, User, ShieldCheck, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { supabase, SUPABASE_URL, type Service, type Worker, type Review } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Turnstile from '@/components/Turnstile';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA';

const STEPS = ['Service', 'Stylist', 'Date & Time', 'Your Details', 'Confirm'];

const ALL_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM',
];

const SERVICE_TYPES = ['Manicure', 'Gel-X', 'Pedicure', 'Full Hair Services', 'Barber Services', 'Brows & Lashes', 'Makeup Services'];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 80 : -80, opacity: 0 }),
};

function slotToMinutes(slot: string): number {
  const m = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function getLADate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
}

function getLAMinutes(): number {
  const t = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date()).replace(/^24:/, '00:');
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < Math.round(rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-zinc-700'}`} />
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}

function StepWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl md:text-3xl font-light text-white mb-8">{title}</h2>
      {children}
    </div>
  );
}

export default function BookingPage() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerCategories, setWorkerCategories] = useState<Record<string, string[]>>({});
  const [workerAssignments, setWorkerAssignments] = useState<Record<string, Record<string, boolean>>>({});
  const [workerReviews, setWorkerReviews] = useState<Record<string, Review[]>>({});
  const [bookedAppointments, setBookedAppointments] = useState<{ time: string; duration: number }[]>([]);
  const [expandedReviews, setExpandedReviews] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Hair");

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  useEffect(() => {
    supabase.from('services').select('*').order('type').order('name').then(({ data }) => {
      if (data) {
        setServices(data);
        const first = SERVICE_TYPES.find((t) => data.some((s) => s.type === t));
        if (first) setActiveTab(first);
      }
    });
  }, []);

  useEffect(() => {
    if (step !== 1) return;
    Promise.all([
      supabase.from('workers').select('*'),
      supabase.from('worker_categories').select('worker_id, category'),
      supabase.from('worker_service_assignments').select('worker_id, service_id, is_available'),
    ]).then(([{ data: workerData }, { data: categoryData }, { data: assignmentData }]) => {
      if (workerData) setWorkers(workerData);
      if (categoryData) setWorkerCategories(categoryData.reduce<Record<string, string[]>>((acc, row) => { (acc[row.worker_id] ??= []).push(row.category); return acc; }, {}));
      if (assignmentData) setWorkerAssignments(assignmentData.reduce<Record<string, Record<string, boolean>>>((acc, row) => { (acc[row.worker_id] ??= {})[row.service_id] = row.is_available; return acc; }, {}));
    });
    supabase.from('reviews').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) {
        const map: Record<string, Review[]> = {};
        data.forEach((r) => {
          if (!map[r.worker_id]) map[r.worker_id] = [];
          map[r.worker_id].push(r);
        });
        setWorkerReviews(map);
      }
    });
  }, [step]);

  useEffect(() => {
    if (!selectedWorker || !selectedDate) return;
    supabase
      .from('appointments')
      .select('time, services(duration)')
      .eq('worker_id', selectedWorker.id)
      .eq('date', selectedDate)
      .in('status', ['pending', 'confirmed'])
      .then(({ data }) => {
        if (data) {
          setBookedAppointments(
            data.map((a: any) => ({ time: a.time, duration: a.services?.duration ?? 30 }))
          );
        }
      });
  }, [selectedWorker, selectedDate]);

  function go(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
    setError('');
    setExpandedReviews(null);
  }

  const BLOCKED_PHONES = ['911','999','112','000','119','110','190','101','102','103','108','122','123','0000000000','1111111111','2222222222','3333333333','4444444444','5555555555','6666666666','7777777777','8888888888','9999999999'];

  function isPhoneValid(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10) return false;
    if (BLOCKED_PHONES.includes(digits)) return false;
    if (/^(\d)\1{9,}$/.test(digits)) return false;
    return true;
  }

  function canAdvance() {
    if (step === 0) return !!selectedService;
    if (step === 1) return !!selectedWorker;
    if (step === 2) return !!selectedDate && !!selectedTime;
    if (step === 3) return name.trim().length > 1 && isPhoneValid(phone) && !!turnstileToken;
    if (step === 4) return otpVerified;
    return false;
  }

  async function sendOtp() {
    setLoading(true);
    setError('');
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sms-send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, turnstileToken }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Failed to send code. Please try again.'); return; }
    if (data.demo) setDemoCode(data.code);
    setOtpSent(true);
  }

  async function verifyOtp() {
    setLoading(true);
    setError('');
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sms-verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code: otp }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Incorrect code. Please try again.'); return; }
    setOtpVerified(true);
    setError('');
  }

  async function confirmBooking() {
    setLoading(true);
    setError('');
    const { error: err } = await supabase.from('appointments').insert({
      customer_name: name.trim(),
      phone: phone.trim(),
      service_id: selectedService!.id,
      worker_id: selectedWorker!.id,
      date: selectedDate,
      time: selectedTime,
      status: 'confirmed',
    });
    setLoading(false);
    if (err) { setError('Something went wrong. Please try again.'); return; }
    // Fire-and-forget SMS notifications
    fetch(`${SUPABASE_URL}/functions/v1/sms-appointment-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: name.trim(),
        serviceName: selectedService!.name,
        workerName: selectedWorker!.name,
        date: selectedDate,
        time: selectedTime,
        workerPhone: selectedWorker!.phone ?? null,
      }),
    });
    setBookingComplete(true);
  }

  const today = getLADate();
  const nowMinutes = getLAMinutes();
  const tabsWithServices = SERVICE_TYPES.filter((t) => services.some((s) => s.type === t));

  const blockedMinutes = new Set<number>();
  for (const appt of bookedAppointments) {
    const start = slotToMinutes(appt.time);
    for (let m = start; m < start + appt.duration; m += 30) blockedMinutes.add(m);
  }

  const filteredWorkers = workers.filter((w) => {
    if (!selectedService) return false;
    const legacyCategoryMap: Record<string, string[]> = { Hair: ['Full Hair Services'], "Men's": ['Barber Services'], Makeup: ['Makeup Services'], Nails: ['Manicure', 'Gel-X', 'Pedicure'] };
    const categories = workerCategories[w.id] ?? (w.specialty ? (legacyCategoryMap[w.specialty] ?? [w.specialty]) : []);
    const override = workerAssignments[w.id]?.[selectedService.id];
    return override ?? categories.includes(selectedService.type);
  });

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <motion.div className="text-center max-w-md" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}>
            <Check className="w-10 h-10 text-zinc-950" />
          </div>
          <h2 className="font-display text-4xl text-white mb-4">You&apos;re Booked!</h2>
          <p className="text-zinc-400 font-light mb-2"><strong className="text-white">{name}</strong>, your appointment is confirmed.</p>
          <div className="mt-8 p-6 border border-[#D4AF37]/30 rounded-sm bg-zinc-900/40 text-left space-y-3 mb-10">
            <Row label="Service" value={selectedService!.name} />
            <Row label="Stylist" value={selectedWorker!.name} />
            <Row label="Date" value={new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} />
            <Row label="Time" value={selectedTime} />
          </div>
          <p className="text-xs text-zinc-500 mb-8">A confirmation SMS has been sent to {phone}.</p>
          <Link href="/" className="inline-block px-10 py-4 text-sm tracking-widest uppercase text-zinc-950 font-medium rounded-sm" style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}>
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.5em] text-[#D4AF37] uppercase mb-3">Reserve Your Visit</p>
          <h1 className="font-display text-4xl md:text-5xl font-light text-white">Book an Appointment</h1>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-12 gap-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${i < step ? 'step-completed' : i === step ? 'step-active' : 'step-inactive'}`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-[#D4AF37]' : 'text-zinc-600'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-10 md:w-14 h-px mx-1 mb-4 transition-all duration-300 ${i < step ? 'bg-[#D4AF37]' : 'bg-zinc-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>

              {/* STEP 0: Select Service */}
              {step === 0 && (
                <StepWrapper title="Choose a Service">
                  <div className="flex gap-1 mb-6 p-1 bg-zinc-900 rounded-sm w-fit flex-wrap">
                    {tabsWithServices.map((t) => (
                      <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-xs rounded-sm transition-all duration-200 ${activeTab === t ? 'bg-[#D4AF37] text-zinc-950 font-medium' : 'text-zinc-400 hover:text-white'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3">
                    {services.filter((s) => s.type === activeTab).map((s) => (
                      <button key={s.id} onClick={() => setSelectedService(s)} className={`service-card flex items-center justify-between p-5 border rounded-sm text-left transition-all duration-300 w-full ${selectedService?.id === s.id ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}`}>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-white font-medium">{s.name}</p>
                          {s.description && <p className="text-zinc-500 text-xs mt-1 font-light leading-relaxed line-clamp-2">{s.description}</p>}
                          <span className="flex items-center gap-1 text-xs text-zinc-600 mt-1.5"><Clock className="w-3 h-3" />{s.duration} min</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-display text-2xl text-[#D4AF37]">{s.price === 0 ? 'Consultation' : `${s.price}`}</span>
                          {selectedService?.id === s.id && <Check className="w-4 h-4 text-[#D4AF37]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </StepWrapper>
              )}

              {/* STEP 1: Select Worker with inline reviews */}
              {step === 1 && (
                <StepWrapper title="Choose Your Stylist">
                  <div className="space-y-4">
                    {filteredWorkers.map((w) => {
                      const reviews = workerReviews[w.id] || [];
                      const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
                      const isSelected = selectedWorker?.id === w.id;
                      const isExpanded = expandedReviews === w.id;

                      return (
                        <div key={w.id} className={`border rounded-sm overflow-hidden transition-all duration-300 ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-zinc-800 bg-zinc-900/40'}`}>
                          <button onClick={() => setSelectedWorker(w)} className="w-full flex items-center gap-4 p-5 text-left">
                            <img src={w.image_url || ''} alt={w.name} className="w-16 h-16 rounded-full object-cover border border-zinc-700 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium">{w.name}</p>
                              <p className="text-xs text-[#D4AF37] tracking-widest uppercase mt-0.5">{w.role}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <StarRow rating={Math.round(avg)} />
                                <span className="text-xs text-zinc-400">
                                  {reviews.length > 0 ? `${avg.toFixed(1)} (${reviews.length} review${reviews.length !== 1 ? 's' : ''})` : 'No reviews yet'}
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check className="w-5 h-5 text-[#D4AF37] shrink-0" />}
                          </button>

                          {reviews.length > 0 && (
                            <>
                              <button onClick={() => setExpandedReviews(isExpanded ? null : w.id)} className="w-full flex items-center justify-between px-5 py-2.5 border-t border-zinc-800/60 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                                <span>{isExpanded ? 'Hide' : 'Read'} {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                                    <div className="divide-y divide-zinc-800/40 max-h-60 overflow-y-auto border-t border-zinc-800/60">
                                      {reviews.slice(0, 5).map((r) => (
                                        <div key={r.id} className="px-5 py-3.5">
                                          <div className="flex items-center gap-2 mb-1">
                                            <StarRow rating={r.rating} />
                                            <span className="text-xs text-zinc-500 font-medium">{r.customer_name}</span>
                                          </div>
                                          {r.feedback && <p className="text-zinc-400 text-xs font-light italic leading-relaxed">&ldquo;{r.feedback}&rdquo;</p>}
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </StepWrapper>
              )}

              {/* STEP 2: Date & Time */}
              {step === 2 && (
                <StepWrapper title="Pick a Date & Time">
                  <div className="mb-8">
                    <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-3">Date</label>
                    <input type="date" min={today} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }} className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                  </div>
                  {selectedDate && (
                    <div>
                      <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-3">Available Times — {selectedWorker?.name}</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {ALL_SLOTS.map((slot) => {
                          const slotMins = slotToMinutes(slot);
                          const booked = blockedMinutes.has(slotMins);
                          const past = selectedDate === today && slotMins <= nowMinutes;
                          const taken = booked || past;
                          return (
                            <button key={slot} disabled={taken} onClick={() => setSelectedTime(slot)} className={`time-slot py-2.5 px-2 text-xs border rounded-sm transition-all duration-200 ${taken ? 'border-zinc-800 text-zinc-700 cursor-not-allowed line-through' : selectedTime === slot ? 'selected border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </StepWrapper>
              )}

              {/* STEP 3: Details */}
              {step === 3 && (
                <StepWrapper title="Your Details">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-3">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="w-full bg-zinc-900 border border-zinc-700 rounded-sm pl-11 pr-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-3">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 000-0000" className="w-full bg-zinc-900 border border-zinc-700 rounded-sm pl-11 pr-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] transition-colors" />
                      </div>
                      {phone.replace(/\D/g, '').length >= 3 && !isPhoneValid(phone) && (
                        <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Please enter a valid phone number</p>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase">Verification</label>
                      <Turnstile
                        siteKey={TURNSTILE_SITE_KEY}
                        onVerify={(token) => setTurnstileToken(token)}
                        onExpire={() => setTurnstileToken('')}
                        theme="dark"
                      />
                      {!turnstileToken && name.trim().length > 1 && isPhoneValid(phone) && (
                        <p className="text-zinc-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />Please complete the verification above</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-8 p-5 border border-zinc-800 rounded-sm bg-zinc-900/30 space-y-3">
                    <p className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-4">Your Booking</p>
                    <Row label="Service" value={selectedService?.name ?? ''} />
                    <Row label="Stylist" value={selectedWorker?.name ?? ''} />
                    <Row label="Date" value={selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''} />
                    <Row label="Time" value={selectedTime} />
                    <div className="pt-3 border-t border-zinc-800 flex justify-between">
                      <span className="text-zinc-400 text-sm">Total</span>
                      <span className="font-display text-xl text-[#D4AF37]">{selectedService?.price === 0 ? 'Consultation' : `$${selectedService?.price}`}</span>
                    </div>
                  </div>
                </StepWrapper>
              )}

              {/* STEP 4: OTP */}
              {step === 4 && (
                <StepWrapper title="Verify Your Phone">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
                      <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                    {!otpSent ? (
                      <div>
                        <p className="text-zinc-400 font-light mb-2">We&apos;ll send a 4-digit code to</p>
                        <p className="text-white font-medium text-lg mb-8">{phone}</p>
                        <button onClick={sendOtp} disabled={loading} className="px-10 py-4 text-sm tracking-widest uppercase font-medium text-zinc-950 rounded-sm disabled:opacity-60 flex items-center gap-2 mx-auto" style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}>
                          {loading ? <><span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin inline-block" />Sending...</> : 'Send Code'}
                        </button>
                      </div>
                    ) : !otpVerified ? (
                      <div>
                        <p className="text-zinc-400 font-light mb-6">Enter the 6-digit code sent to <span className="text-white">{phone}</span></p>
                        {demoCode && (
                          <div className="mb-6 px-4 py-3 border border-[#D4AF37]/30 bg-[#D4AF37]/5 rounded-sm">
                            <p className="text-xs tracking-[0.25em] text-[#D4AF37] uppercase mb-1">Demo mode — SMS not configured</p>
                            <p className="text-white font-mono text-lg tracking-[0.5em]">{demoCode}</p>
                          </div>
                        )}
                        <div className="flex gap-3 justify-center mb-6">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <input key={i} type="text" inputMode="numeric" maxLength={1} value={otp[i] || ''} onChange={(e) => { const val = e.target.value.replace(/\D/, ''); const arr = otp.split(''); arr[i] = val; setOtp(arr.join('')); if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus(); }} id={`otp-${i}`} className="w-11 h-12 text-center text-lg font-medium bg-zinc-900 border border-zinc-700 rounded-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                          ))}
                        </div>
                        {error && <p className="text-red-400 text-sm mb-4 flex items-center gap-2 justify-center"><AlertCircle className="w-4 h-4" />{error}</p>}
                        <button onClick={verifyOtp} disabled={otp.length !== 6 || loading} className="px-10 py-4 text-sm tracking-widest uppercase font-medium text-zinc-950 rounded-sm disabled:opacity-40 flex items-center gap-2 mx-auto" style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}>
                          {loading ? <><span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin inline-block" />Verifying...</> : 'Verify Code'}
                        </button>
                        <button onClick={() => setOtpSent(false)} className="block mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mx-auto">Resend code</button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center gap-2 text-[#D4AF37] mb-6"><Check className="w-5 h-5" /><span className="font-medium">Phone verified!</span></div>
                        <div className="p-5 border border-zinc-800 rounded-sm bg-zinc-900/30 text-left space-y-3 mb-8">
                          <Row label="Service" value={selectedService?.name ?? ''} />
                          <Row label="Stylist" value={selectedWorker?.name ?? ''} />
                          <Row label="Date" value={selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''} />
                          <Row label="Time" value={selectedTime} />
                          <div className="pt-3 border-t border-zinc-800 flex justify-between">
                            <span className="text-zinc-400 text-sm">Total</span>
                            <span className="font-display text-xl text-[#D4AF37]">{selectedService?.price === 0 ? 'Consultation' : `$${selectedService?.price}`}</span>
                          </div>
                        </div>
                        {error && <p className="text-red-400 text-sm mb-4 flex items-center gap-2 justify-center"><AlertCircle className="w-4 h-4" />{error}</p>}
                        <button onClick={confirmBooking} disabled={loading} className="w-full py-4 text-sm tracking-widest uppercase font-medium text-zinc-950 rounded-sm disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}>
                          {loading ? 'Confirming...' : 'Confirm Appointment'}
                        </button>
                      </div>
                    )}
                  </div>
                </StepWrapper>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-800/50">
            <button onClick={() => go(step - 1)} className={`flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors ${step === 0 ? 'invisible' : ''}`}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => go(step + 1)} disabled={!canAdvance()} className="flex items-center gap-2 px-8 py-3 text-sm tracking-[0.15em] uppercase font-medium text-zinc-950 rounded-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105" style={{ background: canAdvance() ? 'linear-gradient(135deg, #D4AF37, #F0D060)' : '#3f3f46' }}>
              {step === 3 ? 'Verify Phone' : 'Continue'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

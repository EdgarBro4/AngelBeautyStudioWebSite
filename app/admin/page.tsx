'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Scissors, Users, Calendar, CheckCircle2, Plus, Edit2, Trash2,
  Phone, Clock, Star, X, Save, LogOut, RefreshCw, MessageSquare,
  Quote, ShieldAlert, Search, Upload, Mail, Settings, Loader2, ArrowLeft
} from 'lucide-react';
import { supabase, SUPABASE_URL, type Worker, type Service, type Appointment, type Review, type StudioSettings, type ServiceType } from '@/lib/supabase';

const TABS = ['Appointments', 'Workers', 'Services', 'Reviews', 'Settings'] as const;
type Tab = typeof TABS[number];

const SERVICE_CATEGORIES: ServiceType[] = ['Manicure', 'Gel-X', 'Pedicure', 'Full Hair Services', 'Barber Services', 'Brows & Lashes', 'Makeup Services'];

function getLADate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
}

function getLATime(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date()).replace(/^24:/, '00:');
}

/* ─── Root page: Auth gate ─── */
export default function AdminPage() {
  const [authState, setAuthState] = useState<'loading' | 'unauthenticated' | 'checking' | 'authorized' | 'denied'>('loading');
  const [userEmail, setUserEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  async function checkWhitelist(email: string) {
    setAuthState('checking');
    const { data } = await supabase.from('admin_whitelist').select('email').eq('email', email).maybeSingle();
    setAuthState(data ? 'authorized' : 'denied');
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setAuthState('unauthenticated'); return; }
      const email = session.user.email ?? '';
      setUserEmail(email);
      checkWhitelist(email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setAuthState('unauthenticated'); setUserEmail(''); return; }
      const email = session.user.email ?? '';
      setUserEmail(email);
      checkWhitelist(email);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function sendMagicLink() {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    setSending(true); setSendError('');

    const { data: allowed } = await supabase
      .from('admin_whitelist')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (!allowed) {
      setSending(false);
      setSendError('This email is not authorized to access the admin panel.');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.href : '' },
    });
    setSending(false);
    if (error) { setSendError(error.message); }
    else { setLinkSent(true); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAuthState('unauthenticated');
    setLinkSent(false);
    setEmailInput('');
  }

  if (authState === 'loading' || authState === 'checking') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <img src="/BAS.svg" alt="Angel Beauty Studio" className="h-16 w-auto object-contain mx-auto mb-8" />
            <h1 className="font-display text-3xl text-white mb-1">Admin Portal</h1>
            <p className="text-zinc-500 text-sm">Enter your authorized email to receive a sign-in link</p>
          </div>

          {!linkSent ? (
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setSendError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendMagicLink(); }}
                  placeholder="your@email.com"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm pl-11 pr-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] text-sm transition-colors"
                />
              </div>
              {sendError && <p className="text-red-400 text-xs">{sendError}</p>}
              <button
                onClick={sendMagicLink}
                disabled={sending || !emailInput.trim()}
                className="w-full flex items-center justify-center gap-2 py-4 text-sm tracking-[0.15em] uppercase font-medium text-zinc-950 rounded-sm disabled:opacity-40 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {sending ? 'Sending...' : 'Send Sign-in Link'}
              </button>
              <p className="text-xs text-zinc-700 text-center">Access restricted to authorized accounts only</p>
            </div>
          ) : (
            <div className="text-center p-8 border border-[#D4AF37]/30 rounded-sm bg-zinc-900/40">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-5">
                <Mail className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="text-white font-medium mb-2">Check your inbox</h3>
              <p className="text-zinc-400 text-sm mb-1">A sign-in link was sent to</p>
              <p className="text-[#D4AF37] text-sm font-medium mb-6">{emailInput}</p>
              <p className="text-zinc-600 text-xs mb-6">Click the link in the email to access the admin panel. It expires in 60 minutes.</p>
              <button onClick={() => { setLinkSent(false); setSendError(''); }} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Use a different email
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (authState === 'denied') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <motion.div className="w-full max-w-sm text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="font-display text-3xl text-white mb-2">Access Denied</h1>
          <p className="text-zinc-400 text-sm mb-2">
            <span className="text-white font-medium">{userEmail}</span>
          </p>
          <p className="text-zinc-500 text-sm mb-8">This email is not on the admin whitelist. Contact the studio owner to request access.</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-8 py-3 text-sm text-zinc-400 border border-zinc-700 rounded-sm hover:text-white hover:border-zinc-500 transition-colors mx-auto"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  return <AdminDashboard onLogout={signOut} userEmail={userEmail} />;
}

/* ─── Dashboard shell ─── */
function AdminDashboard({ onLogout, userEmail }: { onLogout: () => void; userEmail: string }) {
  const [tab, setTab] = useState<Tab>('Appointments');
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-950/96 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/BAS.svg" alt="Angel Beauty Studio" className="h-8 w-auto object-contain" />
            <span className="text-zinc-600 text-sm">/ Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-600 hidden sm:block">{userEmail}</span>
            <button onClick={onLogout} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-1 mb-10 p-1 bg-zinc-900 rounded-sm w-fit flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm rounded-sm transition-all duration-200 ${tab === t ? 'bg-[#D4AF37] text-zinc-950 font-medium' : 'text-zinc-400 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}>
            {tab === 'Appointments' && <AppointmentsTab />}
            {tab === 'Workers' && <WorkersTab />}
            {tab === 'Services' && <ServicesTab />}
            {tab === 'Reviews' && <ReviewsTab />}
            {tab === 'Settings' && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Appointments ─── */
function AppointmentsTab() {
  const [appointments, setAppointments] = useState<(Appointment & { services: Service | null; workers: Worker | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({ customer_name: '', phone: '', service_id: '', worker_id: '', date: '', time: '', status: 'confirmed' as Appointment['status'] });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('appointments').delete().lt('date', today);
    const { data } = await supabase
      .from('appointments')
      .select('*, services(*), workers(*)')
      .in('status', ['pending', 'confirmed'])
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (data) setAppointments(data as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
    supabase.from('workers').select('*').order('name').then(({ data }) => { if (data) setWorkers(data); });
    supabase.from('services').select('*').order('type').order('name').then(({ data }) => { if (data) setServices(data); });
  }, [fetchAppointments]);

  async function saveAppointment() {
    setSaving(true);
    setSaveError('');
    const laDate = getLADate();
    const laTime = getLATime();
    if (form.date < laDate || (form.date === laDate && form.time < laTime)) {
      setSaveError('Cannot create an appointment in the past.');
      setSaving(false);
      return;
    }
    const { error } = await supabase.from('appointments').insert({
      customer_name: form.customer_name,
      phone: form.phone,
      service_id: form.service_id,
      worker_id: form.worker_id,
      date: form.date,
      time: form.time,
      status: form.status,
    });
    if (error) {
      setSaveError('Failed to save appointment. Please try again.');
      setSaving(false);
      return;
    }
    // Fire-and-forget SMS notifications
    const worker = workers.find((w) => w.id === form.worker_id);
    const service = services.find((s) => s.id === form.service_id);
    fetch(`${SUPABASE_URL}/functions/v1/sms-appointment-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: form.customer_name,
        serviceName: service?.name ?? '',
        workerName: worker?.name ?? '',
        date: form.date,
        time: form.time,
        workerPhone: worker?.phone ?? null,
      }),
    });
    await fetchAppointments();
    setShowAdd(false);
    setForm({ customer_name: '', phone: '', service_id: '', worker_id: '', date: '', time: '', status: 'confirmed' });
    setSaving(false);
  }

  const isFormValid = form.customer_name && form.phone && form.service_id && form.worker_id && form.date && form.time;

  async function markComplete(appt: typeof appointments[0]) {
    await supabase.from('appointments').update({ status: 'completed' }).eq('id', appt.id);
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sms-thank-you`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: appt.customer_name,
        phone: appt.phone,
        workerName: appt.workers?.name ?? '',
        serviceName: appt.services?.name ?? '',
      }),
    });
    setNotifications((prev) => [`Thank-you SMS sent to ${appt.customer_name}`, ...prev]);
    setAppointments((prev) => prev.filter((a) => a.id !== appt.id));
  }

  async function cancelAppointment(id: string) {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  const grouped = appointments.reduce<Record<string, typeof appointments>>((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {});

  const servicesByType = services.reduce<Record<string, Service[]>>((acc, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-display text-white">Upcoming Appointments</h2>
          <p className="text-zinc-500 text-sm mt-1">{appointments.length} active appointments</p>
        </div>
        <div className="flex items-center gap-3">
          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-950 rounded-sm"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
            >
              <Plus className="w-4 h-4" /> Add Appointment
            </button>
          )}
          <button onClick={fetchAppointments} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-6 border border-[#D4AF37]/40 rounded-sm bg-zinc-900/60 mb-8">
            <h3 className="text-[#D4AF37] text-xs tracking-widest uppercase mb-6">New Appointment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FormField label="Customer Name" value={form.customer_name} onChange={(v) => setForm((f) => ({ ...f, customer_name: v }))} />
              <FormField label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} type="tel" />
              <div>
                <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-2">Service</label>
                <select
                  value={form.service_id}
                  onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] text-sm transition-colors"
                >
                  <option value="">— Select service —</option>
                  {Object.entries(servicesByType).map(([type, svcs]) => (
                    <optgroup key={type} label={type}>
                      {svcs.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-2">Artist</label>
                <select
                  value={form.worker_id}
                  onChange={(e) => setForm((f) => ({ ...f, worker_id: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] text-sm transition-colors"
                >
                  <option value="">— Select artist —</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} — {w.role}</option>
                  ))}
                </select>
              </div>
              <FormField label="Date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v, time: '' }))} type="date" min={getLADate()} />
              <FormField label="Time" value={form.time} onChange={(v) => setForm((f) => ({ ...f, time: v }))} type="time" min={form.date === getLADate() ? getLATime() : undefined} />
              <div>
                <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Appointment['status'] }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] text-sm transition-colors"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            {saveError && <p className="text-red-400 text-xs mb-4">{saveError}</p>}
            <div className="flex gap-3">
              <button
                onClick={saveAppointment}
                disabled={saving || !isFormValid}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-zinc-950 rounded-sm disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Appointment'}
              </button>
              <button
                onClick={() => { setShowAdd(false); setSaveError(''); }}
                className="px-6 py-2.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {notifications.map((n, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-3 p-4 mb-4 border border-green-500/30 bg-green-500/10 rounded-sm">
            <MessageSquare className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
            <p className="text-green-300 text-sm font-light flex-1">{n}</p>
            <button onClick={() => setNotifications((prev) => prev.filter((_, j) => j !== i))}><X className="w-4 h-4 text-zinc-500 hover:text-white" /></button>
          </motion.div>
        ))}
      </AnimatePresence>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-zinc-900 rounded-sm animate-pulse" />)}</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 text-zinc-600"><Calendar className="w-12 h-12 mx-auto mb-4 opacity-40" /><p>No upcoming appointments</p></div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).sort().map(([date, appts]) => (
            <div key={date}>
              <h3 className="text-xs tracking-[0.4em] text-[#D4AF37] uppercase mb-4">
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <div className="space-y-3">
                {appts.map((a) => (
                  <motion.div key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-zinc-800 rounded-sm bg-zinc-900/40 gap-4">
                    <div className="flex items-center gap-4">
                      <p className="text-[#D4AF37] font-medium text-sm min-w-[56px]">{a.time}</p>
                      <div>
                        <p className="text-white font-medium">{a.customer_name}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-zinc-500">
                          <span className="flex items-center gap-1"><Scissors className="w-3 h-3" />{a.services?.name}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{a.workers?.name}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-sm ${a.status === 'confirmed' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-zinc-800 text-zinc-400'}`}>{a.status}</span>
                      <button onClick={() => markComplete(a)} title="Mark complete" className="w-9 h-9 rounded-sm bg-green-500/10 border border-green-500/30 flex items-center justify-center hover:bg-green-500/20 transition-colors"><CheckCircle2 className="w-5 h-5 text-green-400" /></button>
                      <button onClick={() => cancelAppointment(a.id)} title="Cancel" className="w-9 h-9 rounded-sm bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors"><X className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Workers ─── */
function WorkersTab() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>(SERVICE_CATEGORIES);
  const [workerCategories, setWorkerCategories] = useState<Record<string, string[]>>({});
  const [workerAssignments, setWorkerAssignments] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', bio: '', categories: [] as string[], serviceOverrides: {} as Record<string, boolean>, image_url: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchWorkers() {
    const [{ data: w }, { data: r }, { data: s }, { data: c }, { data: a }, { data: categoryData }] = await Promise.all([
      supabase.from('workers').select('*').order('name'),
      supabase.from('reviews').select('id, worker_id, rating, feedback, customer_name, created_at'),
      supabase.from('services').select('*').order('type').order('name'),
      supabase.from('worker_categories').select('worker_id, category'),
      supabase.from('worker_service_assignments').select('worker_id, service_id, is_available'),
      supabase.from('service_categories').select('name').order('name'),
    ]);
    if (w) setWorkers(w);
    if (r) setReviews(r);
    if (s) setServices(s);
    if (categoryData?.length) setServiceCategories(categoryData.map((row) => row.name));
    if (c) setWorkerCategories(c.reduce<Record<string, string[]>>((acc, row) => { (acc[row.worker_id] ??= []).push(row.category); return acc; }, {}));
    if (a) setWorkerAssignments(a.reduce<Record<string, Record<string, boolean>>>((acc, row) => { (acc[row.worker_id] ??= {})[row.service_id] = row.is_available; return acc; }, {}));
    setLoading(false);
  }
  useEffect(() => { fetchWorkers(); }, []);

  function calcRating(workerId: string) {
    const wReviews = reviews.filter((r) => r.worker_id === workerId);
    if (!wReviews.length) return null;
    return (wReviews.reduce((a, r) => a + r.rating, 0) / wReviews.length).toFixed(1);
  }

  function startEdit(w: Worker) {
    const legacyCategoryMap: Record<string, string[]> = { Hair: ['Full Hair Services'], "Men's": ['Barber Services'], Makeup: ['Makeup Services'], Nails: ['Manicure', 'Gel-X', 'Pedicure'] };
    const categories = workerCategories[w.id] ?? (w.specialty ? (legacyCategoryMap[w.specialty] ?? [w.specialty]) : []);
    setForm({ name: w.name, role: w.role, bio: w.bio ?? '', categories, serviceOverrides: workerAssignments[w.id] ?? {}, image_url: w.image_url ?? '', phone: w.phone ?? '' });
    setUploadError('');
    setEditingId(w.id); setShowAdd(false);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setUploadError('');
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `worker-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('WorkersPics').upload(path, file);
    if (error) {
      setUploadError(error.message);
    } else {
      const { data } = supabase.storage.from('WorkersPics').getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
    }
    if (fileRef.current) fileRef.current.value = '';
    setUploading(false);
  }

  async function saveWorker() {
    setSaving(true);
    const payload = {
      name: form.name,
      role: form.role,
      bio: form.bio || null,
      specialty: form.categories[0] || null,
      image_url: form.image_url || null,
      phone: form.phone || null,
    };
    let workerId = editingId;
    if (editingId) await supabase.from('workers').update(payload).eq('id', editingId);
    else {
      const { data } = await supabase.from('workers').insert(payload).select('id').maybeSingle();
      workerId = data?.id ?? null;
    }
    if (workerId) {
      await supabase.from('worker_categories').delete().eq('worker_id', workerId);
      if (form.categories.length) await supabase.from('worker_categories').insert(form.categories.map((category) => ({ worker_id: workerId, category })));
      await supabase.from('worker_service_assignments').delete().eq('worker_id', workerId);
      const overrides = Object.entries(form.serviceOverrides).map(([service_id, is_available]) => ({ worker_id: workerId, service_id, is_available }));
      if (overrides.length) await supabase.from('worker_service_assignments').insert(overrides);
    }
    await fetchWorkers();
    setEditingId(null); setShowAdd(false);
    setForm({ name: '', role: '', bio: '', categories: [], serviceOverrides: {}, image_url: '', phone: '' });
    setSaving(false);
  }

  async function confirmDeleteWorker() {
    if (!confirmDeleteId) return;
    setDeleting(true);
    setDeleteError('');
    const worker = workers.find((w) => w.id === confirmDeleteId);
    if (worker?.image_url) {
      const marker = '/WorkersPics/';
      const idx = worker.image_url.indexOf(marker);
      if (idx !== -1) {
        const storagePath = worker.image_url.slice(idx + marker.length);
        await supabase.storage.from('WorkersPics').remove([storagePath]);
      }
    }
    const { error } = await supabase.from('workers').delete().eq('id', confirmDeleteId);
    if (error) {
      setDeleteError('Failed to delete worker. Please try again.');
      setDeleting(false);
      return;
    }
    setWorkers((prev) => prev.filter((w) => w.id !== confirmDeleteId));
    setConfirmDeleteId(null);
    setDeleting(false);
  }

  const isEditing = editingId !== null || showAdd;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-display text-white">Team Members</h2>
          <p className="text-zinc-500 text-sm mt-1">{workers.length} stylists</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => { setShowAdd(true); setForm({ name: '', role: '', bio: '', categories: [], serviceOverrides: {}, image_url: '', phone: '' }); setUploadError(''); setEditingId(null); }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-950 rounded-sm"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
          >
            <Plus className="w-4 h-4" /> Add Worker
          </button>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-6 border border-[#D4AF37]/40 rounded-sm bg-zinc-900/60 mb-8">
            <h3 className="text-[#D4AF37] text-xs tracking-widest uppercase mb-6">{editingId ? 'Edit Worker' : 'New Worker'}</h3>

            {/* Photo upload */}
            <div className="mb-5">
              <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-3">Photo</label>
              <div className="flex items-center gap-4">
                {form.image_url ? (
                  <img src={form.image_url} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-zinc-700" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Users className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 text-xs border border-zinc-700 rounded-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
                {form.image_url && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, image_url: '' }))} className="text-xs text-zinc-600 hover:text-red-400 transition-colors">Remove</button>
                )}
              </div>
              {uploadError && <p className="mt-2 text-xs text-red-400">{uploadError}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FormField label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
              <FormField label="Title / Role" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} />
              <FormField label="Phone (for booking SMS)" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} type="tel" />
              <div>
                <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-2">Categories</label>
                <div className="grid grid-cols-1 gap-2 rounded-sm border border-zinc-700 bg-zinc-900 p-3">
                  {serviceCategories.map((category) => (
                    <label key={category} className="flex items-center gap-2 text-sm text-zinc-300">
                      <input type="checkbox" checked={form.categories.includes(category)} onChange={(e) => setForm((f) => ({ ...f, categories: e.target.checked ? [...f.categories, category] : f.categories.filter((item) => item !== category) }))} className="accent-[#D4AF37]" />
                      {category}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-2">Individual Service Access</label>
              <p className="mb-3 text-xs text-zinc-500">Category access includes every service in that category. Use these switches to exclude individual services or add services from another category.</p>
              <div className="grid grid-cols-1 gap-2 rounded-sm border border-zinc-700 bg-zinc-900 p-4 sm:grid-cols-2">
                {services.map((service) => {
                  const defaultAvailable = form.categories.includes(service.type);
                  const available = form.serviceOverrides[service.id] ?? defaultAvailable;
                  return (
                    <label key={service.id} className="flex items-center gap-2 text-xs text-zinc-300">
                      <input type="checkbox" checked={available} onChange={(e) => setForm((f) => {
                        const next = { ...f.serviceOverrides };
                        if (e.target.checked === defaultAvailable) delete next[service.id];
                        else next[service.id] = e.target.checked;
                        return { ...f, serviceOverrides: next };
                      })} className="accent-[#D4AF37]" />
                      <span>{service.name}</span>
                      <span className="ml-auto text-zinc-600">{service.type}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-2">Bio</label>
              <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] resize-none text-sm" />
            </div>
            <div className="flex gap-3">
              <button onClick={saveWorker} disabled={saving || !form.name || !form.categories.length || uploading} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-zinc-950 rounded-sm disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}>
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setEditingId(null); setShowAdd(false); }} className="px-6 py-2.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-sm transition-colors">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-zinc-900 rounded-sm animate-pulse" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {workers.map((w) => {
            const avg = calcRating(w.id);
            return (
              <div key={w.id}>
                <div className={`flex items-center gap-4 p-5 border rounded-sm bg-zinc-900/40 transition-colors ${confirmDeleteId === w.id ? 'border-red-500/40' : 'border-zinc-800'}`}>
                  <img src={w.image_url || 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=100'} alt={w.name} className="w-14 h-14 rounded-full object-cover border border-zinc-700" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{w.name}</p>
                    <p className="text-xs text-[#D4AF37] tracking-widest uppercase mt-0.5">{w.role}</p>
                    {(workerCategories[w.id] ?? (w.specialty ? (({ Hair: ['Full Hair Services'], "Men's": ['Barber Services'], Makeup: ['Makeup Services'], Nails: ['Manicure', 'Gel-X', 'Pedicure'] } as Record<string, string[]>)[w.specialty] ?? [w.specialty]) : [])).map((category) => <p key={category} className="text-xs text-zinc-500 mt-0.5">{category}</p>)}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                      <span className="text-xs text-zinc-400">{avg ?? 'No reviews'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(w)} className="w-8 h-8 flex items-center justify-center border border-zinc-700 rounded-sm text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setConfirmDeleteId(w.id); setDeleteError(''); }} className="w-8 h-8 flex items-center justify-center border border-zinc-700 rounded-sm text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <AnimatePresence>
                  {confirmDeleteId === w.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 p-4 border border-red-500/30 rounded-sm bg-red-500/5">
                        <p className="text-white text-sm font-medium mb-0.5">Delete {w.name}?</p>
                        <p className="text-zinc-500 text-xs mb-3">Their reviews will also be removed. This cannot be undone.</p>
                        {deleteError && <p className="text-red-400 text-xs mb-3">{deleteError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setConfirmDeleteId(null); setDeleteError(''); }}
                            className="px-4 py-2 text-xs text-zinc-400 border border-zinc-700 rounded-sm hover:text-white hover:border-zinc-500 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={confirmDeleteWorker}
                            disabled={deleting}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-500/20 border border-red-500/40 rounded-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          >
                            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Services ─── */
function ServicesTab() {
  type ServiceCategory = { id: string; name: string };
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [form, setForm] = useState({ name: '', duration: '60', price: '', description: '' });
  const [categoryName, setCategoryName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchServices() {
    const [{ data: serviceData }, { data: categoryData }] = await Promise.all([
      supabase.from('services').select('*').order('type').order('name'),
      supabase.from('service_categories').select('id, name').order('name'),
    ]);
    if (serviceData) setServices(serviceData);
    if (categoryData) {
      setCategories(categoryData);
      setSelectedCategoryId((current) => current ?? categoryData[0]?.id ?? null);
    }
    setLoading(false);
  }
  useEffect(() => { fetchServices(); }, []);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;
  const selectedServices = selectedCategory ? services.filter((service) => service.type === selectedCategory.name) : [];
  const isEditingService = editingId !== null || showServiceForm;

  function startAddService() {
    if (!selectedCategory) return;
    setEditingId(null);
    setForm({ name: '', duration: '60', price: '', description: '' });
    setShowServiceForm(true);
    setConfirmDeleteId(null);
  }

  function startEdit(s: Service) {
    const category = categories.find((item) => item.name === s.type);
    if (category) setSelectedCategoryId(category.id);
    setForm({ name: s.name, duration: String(s.duration), price: String(s.price), description: s.description ?? '' });
    setEditingId(s.id);
    setShowServiceForm(false);
    setConfirmDeleteId(null);
  }

  async function saveService() {
    if (!selectedCategory) return;
    setSaving(true);
    const payload = { name: form.name.trim(), type: selectedCategory.name, duration: parseInt(form.duration, 10), price: parseFloat(form.price), description: form.description.trim() || null };
    if (editingId) await supabase.from('services').update(payload).eq('id', editingId);
    else await supabase.from('services').insert(payload);
    await fetchServices();
    setEditingId(null);
    setShowServiceForm(false);
    setForm({ name: '', duration: '60', price: '', description: '' });
    setSaving(false);
  }

  async function saveCategory() {
    const name = categoryName.trim();
    if (!name) return;
    setSavingCategory(true);
    setCategoryError('');
    const { data, error } = await supabase.from('service_categories').insert({ name }).select('id, name').maybeSingle();
    if (error) setCategoryError(error.code === '23505' ? 'That category already exists.' : 'Could not create the category.');
    else if (data) {
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedCategoryId(data.id);
      setCategoryName('');
      setShowCategoryForm(false);
    }
    setSavingCategory(false);
  }

  async function confirmDeleteService() {
    if (!confirmDeleteId) return;
    setDeleting(true);
    await supabase.from('services').delete().eq('id', confirmDeleteId);
    setServices((prev) => prev.filter((service) => service.id !== confirmDeleteId));
    setConfirmDeleteId(null);
    setDeleting(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-display text-white">Service Categories</h2>
          <p className="text-zinc-500 text-sm mt-1">{categories.length} categories · {services.length} services</p>
        </div>
        {!showCategoryForm && !isEditingService && (
          <button onClick={() => { setShowCategoryForm(true); setCategoryError(''); }} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-950 rounded-sm" style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}>
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCategoryForm && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="p-5 border border-[#D4AF37]/40 rounded-sm bg-zinc-900/60 mb-8">
            <h3 className="text-[#D4AF37] text-xs tracking-widest uppercase mb-4">New Category</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveCategory(); }} placeholder="Category name" className="flex-1 bg-zinc-900 border border-zinc-700 rounded-sm px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] text-sm" autoFocus />
              <button onClick={saveCategory} disabled={savingCategory || !categoryName.trim()} className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-zinc-950 rounded-sm disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}>{savingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create Category</button>
              <button onClick={() => { setShowCategoryForm(false); setCategoryName(''); setCategoryError(''); }} className="px-5 py-3 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-sm">Cancel</button>
            </div>
            {categoryError && <p className="text-red-400 text-xs mt-3">{categoryError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-zinc-900 rounded-sm animate-pulse" />)}</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {categories.map((category) => {
              const count = services.filter((service) => service.type === category.name).length;
              const active = category.id === selectedCategoryId;
              return (
                <button key={category.id} onClick={() => { setSelectedCategoryId(category.id); setEditingId(null); setShowServiceForm(false); setConfirmDeleteId(null); }} className={`text-left p-5 border rounded-sm transition-all ${active ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600'}`}>
                  <div className="flex items-start justify-between gap-3"><h3 className="text-white font-display text-xl">{category.name}</h3><span className="text-xs text-[#D4AF37] border border-[#D4AF37]/30 rounded-full px-2 py-1">{count}</span></div>
                  <p className="text-zinc-500 text-xs mt-4">Click to manage services</p>
                </button>
              );
            })}
          </div>

          {selectedCategory && (
            <div className="border-t border-zinc-800 pt-8">
              <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
                <div><p className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase">Category</p><h3 className="font-display text-2xl text-white mt-1">{selectedCategory.name}</h3></div>
                {!isEditingService && <button onClick={startAddService} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-950 rounded-sm" style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}><Plus className="w-4 h-4" /> Add Service</button>}
              </div>

              <AnimatePresence>
                {isEditingService && (
                  <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="p-6 border border-[#D4AF37]/40 rounded-sm bg-zinc-900/60 mb-6">
                    <h3 className="text-[#D4AF37] text-xs tracking-widest uppercase mb-5">{editingId ? 'Edit Service' : `New Service in ${selectedCategory.name}`}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"><FormField label="Name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} /><FormField label="Duration (min)" value={form.duration} onChange={(value) => setForm((current) => ({ ...current, duration: value }))} type="number" /><FormField label="Price ($)" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} type="number" /></div>
                    <div className="mb-6"><label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-2">Description (optional)</label><textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} rows={2} className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] resize-none text-sm" /></div>
                    <div className="flex gap-3"><button onClick={saveService} disabled={saving || !form.name.trim() || form.price === ''} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-zinc-950 rounded-sm disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Service'}</button><button onClick={() => { setEditingId(null); setShowServiceForm(false); }} className="px-6 py-2.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-sm">Cancel</button></div>
                  </motion.div>
                )}
              </AnimatePresence>

              {selectedServices.length === 0 ? <div className="text-center py-12 border border-dashed border-zinc-800 rounded-sm text-zinc-600 text-sm">No services in this category yet.</div> : <div className="space-y-2">{selectedServices.map((service) => <div key={service.id} className={`flex items-center justify-between gap-4 p-4 border rounded-sm bg-zinc-900/40 group ${confirmDeleteId === service.id ? 'border-red-500/40' : 'border-zinc-800'}`}><div className="min-w-0"><p className="text-white text-sm font-medium">{service.name}</p><div className="flex items-center gap-3 mt-1"><span className="flex items-center gap-1 text-xs text-zinc-600"><Clock className="w-3 h-3" />{service.duration} min</span>{service.description && <span className="text-xs text-zinc-600 truncate">{service.description}</span>}</div></div><div className="flex items-center gap-3 shrink-0"><span className="font-display text-lg text-[#D4AF37]">{service.price === 0 ? 'Consultation' : `${service.price}`}</span><button onClick={() => startEdit(service)} className="w-8 h-8 flex items-center justify-center border border-zinc-700 rounded-sm text-zinc-500 hover:text-[#D4AF37] transition-colors"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => setConfirmDeleteId(service.id)} className="w-8 h-8 flex items-center justify-center border border-zinc-700 rounded-sm text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div></div>)}</div>}

              <AnimatePresence>{confirmDeleteId && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="mt-4 p-4 border border-red-500/30 rounded-sm bg-red-500/5 flex items-center justify-between gap-4"><p className="text-white text-sm">Delete this service?</p><div className="flex gap-2"><button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-xs text-zinc-400 border border-zinc-700 rounded-sm">Cancel</button><button onClick={confirmDeleteService} disabled={deleting} className="flex items-center gap-1.5 px-4 py-2 text-xs text-white bg-red-500/20 border border-red-500/40 rounded-sm disabled:opacity-50">{deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete</button></div></div></motion.div>}</AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Reviews ─── */
function ReviewsTab() {
  const [reviews, setReviews] = useState<(Review & { workers: { name: string; role: string } | null })[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWorker, setFilterWorker] = useState('');
  const [search, setSearch] = useState('');

  async function fetchReviews() {
    const { data } = await supabase.from('reviews').select('*, workers(name, role)').order('created_at', { ascending: false });
    if (data) setReviews(data as any);
    setLoading(false);
  }

  useEffect(() => {
    fetchReviews();
    supabase.from('workers').select('id, name, role').order('name').then(({ data }) => { if (data) setWorkers(data as any); });
  }, []);

  async function deleteReview(id: string) {
    await supabase.from('reviews').delete().eq('id', id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = reviews
    .filter((r) => !filterWorker || r.worker_id === filterWorker)
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.customer_name?.toLowerCase().includes(q) ||
        r.feedback?.toLowerCase().includes(q) ||
        r.workers?.name?.toLowerCase().includes(q)
      );
    });

  function StarDisplay({ rating }: { rating: number }) {
    return <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-zinc-700'}`} />)}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-display text-white">Customer Reviews</h2>
          <p className="text-zinc-500 text-sm mt-1">{filtered.length} reviews</p>
        </div>
        <select value={filterWorker} onChange={(e) => setFilterWorker(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors">
          <option value="">All stylists</option>
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, stylist, or review content..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-sm pl-11 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] text-sm transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-zinc-900 rounded-sm animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-600"><Quote className="w-12 h-12 mx-auto mb-4 opacity-40" /><p>No reviews found</p></div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((r) => (
              <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-4 p-5 border border-zinc-800 rounded-sm bg-zinc-900/40">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <StarDisplay rating={r.rating} />
                    <span className="text-white text-sm font-medium">{r.customer_name}</span>
                    {r.workers && <span className="text-xs text-[#D4AF37] tracking-widest uppercase">— {r.workers.name}</span>}
                    <span className="text-xs text-zinc-600 ml-auto">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {r.feedback && <p className="text-zinc-400 text-sm font-light italic leading-relaxed">&ldquo;{r.feedback}&rdquo;</p>}
                </div>
                <button onClick={() => deleteReview(r.id)} title="Delete review" className="w-8 h-8 flex items-center justify-center border border-zinc-700 rounded-sm text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ─── Settings / Whitelist ─── */
function SettingsTab() {
  const [whitelist, setWhitelist] = useState<{ email: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPhoneSaving, setAdminPhoneSaving] = useState(false);
  const [adminPhoneSaved, setAdminPhoneSaved] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  async function fetchWhitelist() {
    const { data } = await supabase.from('admin_whitelist').select('*').order('created_at');
    if (data) setWhitelist(data);
    setLoading(false);
  }

  async function fetchAdminPhone() {
    const { data } = await supabase.from('studio_settings').select('admin_phone').eq('id', 1).maybeSingle();
    if (data?.admin_phone) setAdminPhone(data.admin_phone);
  }

  async function saveAdminPhone() {
    setAdminPhoneSaving(true);
    await supabase.from('studio_settings').upsert({ id: 1, admin_phone: adminPhone.trim() || null, updated_at: new Date().toISOString() });
    setAdminPhoneSaving(false);
    setAdminPhoneSaved(true);
    setTimeout(() => setAdminPhoneSaved(false), 2500);
  }
  useEffect(() => { fetchWhitelist(); fetchAdminPhone(); }, []);

  async function addEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!email.includes('@') || !email.includes('.')) { setError('Enter a valid email address.'); return; }
    if (whitelist.some((w) => w.email === email)) { setError('This email is already on the whitelist.'); return; }
    setAdding(true); setError('');
    const { error: err } = await supabase.from('admin_whitelist').insert({ email });
    if (err) { setError('Failed to add email. Try again.'); }
    else { setNewEmail(''); await fetchWhitelist(); }
    setAdding(false);
  }

  async function confirmRemoveEmail() {
    if (!confirmRemove) return;
    setRemoving(true);
    await supabase.from('admin_whitelist').delete().eq('email', confirmRemove);
    setWhitelist((prev) => prev.filter((w) => w.email !== confirmRemove));
    setConfirmRemove(null);
    setRemoving(false);
  }

  function requestRemove(email: string) {
    if (whitelist.length <= 1) { setError('You must keep at least one admin email.'); return; }
    setConfirmRemove(email);
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h2 className="text-2xl font-display text-white">Admin Access</h2>
        <p className="text-zinc-500 text-sm mt-1">Only these email addresses can access the admin panel</p>
      </div>

      {/* Admin notification phone */}
      <div className="p-6 border border-[#D4AF37]/30 rounded-sm bg-zinc-900/40 mb-8">
        <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-1">Admin Notification Phone</label>
        <p className="text-zinc-500 text-xs mb-4">This number receives an SMS for every new appointment booked.</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="tel"
              value={adminPhone}
              onChange={(e) => { setAdminPhone(e.target.value); setAdminPhoneSaved(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') saveAdminPhone(); }}
              placeholder="(555) 000-0000"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-sm pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] text-sm transition-colors"
            />
          </div>
          <button
            onClick={saveAdminPhone}
            disabled={adminPhoneSaving}
            className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-zinc-950 rounded-sm disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
          >
            {adminPhoneSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : adminPhoneSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {adminPhoneSaved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Add email */}
      <div className="p-6 border border-[#D4AF37]/30 rounded-sm bg-zinc-900/40 mb-6">
        <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-3">Add Email Address</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') addEmail(); }}
              placeholder="name@email.com"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-sm pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37] text-sm transition-colors"
            />
          </div>
          <button
            onClick={addEmail}
            disabled={adding || !newEmail.trim()}
            className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-zinc-950 rounded-sm disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {/* Whitelist */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 bg-zinc-900 rounded-sm animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {whitelist.map((w) => (
            <div key={w.email}>
              <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-sm bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-white text-sm">{w.email}</p>
                    <p className="text-xs text-zinc-600">Added {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <button
                  onClick={() => requestRemove(w.email)}
                  className="w-8 h-8 flex items-center justify-center border border-zinc-700 rounded-sm text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inline confirmation */}
              <AnimatePresence>
                {confirmRemove === w.email && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 p-4 border border-red-500/30 rounded-sm bg-red-500/5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-white text-sm font-medium">Remove admin access?</p>
                        <p className="text-zinc-500 text-xs mt-0.5 break-all">{w.email} will no longer be able to sign in.</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="px-4 py-2 text-xs text-zinc-400 border border-zinc-700 rounded-sm hover:text-white hover:border-zinc-500 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmRemoveEmail}
                          disabled={removing}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-500/20 border border-red-500/40 rounded-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', min }: { label: string; value: string; onChange: (v: string) => void; type?: string; min?: string }) {
  return (
    <div>
      <label className="block text-xs tracking-[0.3em] text-[#D4AF37] uppercase mb-2">{label}</label>
      <input type={type} value={value} min={min} onChange={(e) => onChange(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] text-sm transition-colors" />
    </div>
  );
}

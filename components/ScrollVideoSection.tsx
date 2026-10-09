'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SUPABASE_URL } from '@/lib/supabase';

const TOTAL_FRAMES = 300;

function frameUrl(index: number): string {
  const num = String(index + 1).padStart(4, '0');
  return `${SUPABASE_URL}/storage/v1/object/public/frames/frame_${num}.png`;
}

function segmentOpacity(frame: number, start: number, end: number, fadeLen = 22): number {
  if (frame < start || frame > end) return 0;
  if (frame < start + fadeLen) return (frame - start) / fadeLen;
  if (frame > end - fadeLen) return (end - frame) / fadeLen;
  return 1;
}

// Fades in at `start` and stays fully visible — never fades out
function fadeInAndHold(frame: number, start: number, fadeLen = 18): number {
  if (frame < start) return 0;
  return Math.min(1, (frame - start) / fadeLen);
}

const textShadow = '0 2px 40px rgba(0,0,0,0.95), 0 1px 6px rgba(0,0,0,1), 0 4px 60px rgba(0,0,0,0.8)';

export default function ScrollVideoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES));
  const loadedCount = useRef(0);
  const activeFrame = useRef(0);
  const rafId = useRef<number | null>(null);

  const [frameIndex, setFrameIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  function drawFrame(index: number) {
    const canvas = canvasRef.current;
    const img = images.current[index];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const coverScale = Math.max(cw / iw, ch / ih);
    const sw = iw * coverScale;
    const sh = ih * coverScale;
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh);
  }

  function loadFrame(index: number) {
    if (index < 0 || index >= TOTAL_FRAMES) return;
    if (images.current[index]) return;

    const img = new Image();
    img.decoding = 'async';
    img.src = frameUrl(index);
    img.onload = () => {
      loadedCount.current++;
      const pct = Math.round((loadedCount.current / TOTAL_FRAMES) * 100);
      setLoadProgress(pct);
      if (loadedCount.current >= 15 && !ready) setReady(true);
      if (index === activeFrame.current) drawFrame(index);
    };
    img.onerror = () => {
      loadedCount.current++;
      const pct = Math.round((loadedCount.current / TOTAL_FRAMES) * 100);
      setLoadProgress(pct);
      if (loadedCount.current >= 15 && !ready) setReady(true);
    };
    images.current[index] = img;
  }

  function prefetchAround(center: number, radius: number) {
    const start = Math.max(0, center - radius);
    const end = Math.min(TOTAL_FRAMES - 1, center + radius);
    for (let i = start; i <= end; i++) loadFrame(i);
  }

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(activeFrame.current);
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Prefetch the first batch so the intro is ready immediately
    for (let i = 0; i < 20; i++) loadFrame(i);
    // Then progressively load the rest in the background
    let i = 20;
    const interval = setInterval(() => {
      if (i >= TOTAL_FRAMES) {
        clearInterval(interval);
        return;
      }
      loadFrame(i);
      i++;
    }, 60);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onScroll() {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        const scrolled = -el.getBoundingClientRect().top;
        const scrollable = el.offsetHeight - window.innerHeight;
        const progress = Math.max(0, Math.min(1, scrolled / scrollable));
        const next = Math.min(
          Math.round(progress * (TOTAL_FRAMES - 1)),
          TOTAL_FRAMES - 1,
        );
        if (next !== activeFrame.current) {
          activeFrame.current = next;
          setFrameIndex(next);
          prefetchAround(next, 15);
          drawFrame(next);
        }
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = !ready;

  // Text beats scaled for 300 frames (1.25x of original 240-frame timings)
  const o1 = segmentOpacity(frameIndex, 0, 72);
  const o2 = segmentOpacity(frameIndex, 85, 160);
  const o3 = segmentOpacity(frameIndex, 172, 248);
  const o4 = fadeInAndHold(frameIndex, 256, 18);

  const ctaDarkness = fadeInAndHold(frameIndex, 244, 24);

  const scrollHintOpacity = Math.max(0, 1 - frameIndex / 19);

  return (
    <section ref={containerRef} className="relative" style={{ height: '500vh' }}>
      <div className="sticky top-0 overflow-hidden bg-zinc-950" style={{ height: '100dvh' }}>

        {/* Loading bar */}
        {isLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950">
            <div className="text-center">
              <div className="w-52 h-px bg-zinc-800 mx-auto mb-5 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${loadProgress}%`,
                    background: 'linear-gradient(90deg, #D4AF37, #F0D060)',
                  }}
                />
              </div>
              <p className="text-[10px] text-zinc-600 tracking-[0.4em] uppercase">{loadProgress}%</p>
            </div>
          </div>
        )}

        {/* Canvas — pixel dimensions set in JS, CSS fills the sticky container */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />

        {/* Base dark overlay — always on */}
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />

        {/* Extra darkness layer that deepens when CTA appears */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.35)', opacity: ctaDarkness }}
        />

        {/* Edge vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-zinc-950/80 to-transparent pointer-events-none" />

        {/* ── Text beats ── */}
        <div className="absolute inset-0 flex items-center justify-center">

          {/* Beat 1 */}
          <div
            className="absolute text-center px-8 max-w-4xl w-full"
            style={{ opacity: o1, willChange: 'opacity' }}
          >
            <p
              className="text-[10px] tracking-[0.55em] text-[#D4AF37] uppercase mb-6"
              style={{ textShadow }}
            >
              Angel Beauty Studio
            </p>
            <h2
              className="font-display text-[clamp(3.5rem,9vw,7.5rem)] font-light text-white leading-[1.05]"
              style={{ textShadow }}
            >
              Crafted<br />with Care
            </h2>
          </div>

          {/* Beat 2 */}
          <div
            className="absolute text-center px-8 max-w-4xl w-full"
            style={{ opacity: o2, willChange: 'opacity' }}
          >
            <h2
              className="font-display text-[clamp(2.8rem,8vw,7rem)] font-light text-white leading-[1.05] mb-7"
              style={{ textShadow }}
            >
              Where Artistry<br />Meets Elegance
            </h2>
            <div
              className="w-16 h-px bg-[#D4AF37] mx-auto"
              style={{ boxShadow: '0 0 12px rgba(212,175,55,0.6)' }}
            />
          </div>

          {/* Beat 3 */}
          <div
            className="absolute text-center px-8 max-w-4xl w-full"
            style={{ opacity: o3, willChange: 'opacity' }}
          >
            <p
              className="text-[10px] tracking-[0.55em] text-[#D4AF37] uppercase mb-6"
              style={{ textShadow }}
            >
              Every Detail
            </p>
            <h2
              className="font-display text-[clamp(4rem,11vw,9rem)] font-light text-white leading-[1.05]"
              style={{ textShadow }}
            >
              Perfected
            </h2>
          </div>

          {/* Beat 4 — CTA: fades in, never fades out */}
          <div
            className="absolute text-center px-8 max-w-4xl w-full pointer-events-auto"
            style={{ opacity: o4, willChange: 'opacity' }}
          >
            <h2
              className="font-display text-[clamp(2.8rem,8vw,7rem)] font-light text-white leading-[1.05] mb-10"
              style={{ textShadow }}
            >
              Your Transformation<br />Awaits
            </h2>
            <Link
              href="/book"
              className="inline-block px-14 py-5 text-xs tracking-[0.3em] uppercase font-semibold text-zinc-950 rounded-sm hover:scale-105 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #F0D060)',
                boxShadow: '0 0 40px rgba(212,175,55,0.45), 0 4px 20px rgba(0,0,0,0.6)',
              }}
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: scrollHintOpacity }}
        >
          <p className="text-[10px] tracking-[0.4em] text-zinc-400 uppercase" style={{ textShadow }}>Scroll</p>
          <div className="w-px h-10 bg-gradient-to-b from-[#D4AF37]/80 to-transparent" />
        </div>

        {/* Frame progress bar */}
        <div className="absolute bottom-0 left-0 h-[2px] bg-[#D4AF37]/15 w-full pointer-events-none">
          <div
            className="h-full bg-[#D4AF37]/60 transition-none"
            style={{ width: `${(frameIndex / (TOTAL_FRAMES - 1)) * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}

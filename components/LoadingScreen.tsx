'use client';

import { useEffect, useState } from 'react';

function ScissorsAnimation() {
  return (
    <div className="w-36 h-36 flex items-center justify-center relative">
      <svg viewBox="0 0 110 90" className="w-36 h-36" style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))' }}>
        {/* Top half: handle ring + arm + blade, pivots around (46,44) */}
        <g style={{ transformOrigin: '46px 44px', animation: 'snipTop 1.5s ease-in-out infinite' }}>
          {/* Handle ring */}
          <circle cx="15" cy="20" r="10" fill="none" stroke="#D4AF37" strokeWidth="2.5" />
          <circle cx="15" cy="20" r="4.5" fill="none" stroke="#D4AF37" strokeWidth="1.8" />
          {/* Arm from ring to pivot */}
          <path d="M15 30 Q28 35 46 44" fill="none" stroke="#D4AF37" strokeWidth="2.8" strokeLinecap="round" />
          {/* Blade — tapered from pivot to tip */}
          <path d="M46 44 L96 20 L99 13 L93 12 Z" fill="#D4AF37" />
        </g>

        {/* Bottom half: handle ring + arm + blade, pivots around (46,44) */}
        <g style={{ transformOrigin: '46px 44px', animation: 'snipBottom 1.5s ease-in-out infinite' }}>
          {/* Handle ring */}
          <circle cx="15" cy="68" r="10" fill="none" stroke="#F0D060" strokeWidth="2.5" />
          <circle cx="15" cy="68" r="4.5" fill="none" stroke="#F0D060" strokeWidth="1.8" />
          {/* Arm from ring to pivot */}
          <path d="M15 58 Q28 53 46 44" fill="none" stroke="#F0D060" strokeWidth="2.8" strokeLinecap="round" />
          {/* Blade — tapered from pivot to tip */}
          <path d="M46 44 L96 68 L99 75 L93 76 Z" fill="#F0D060" />
        </g>

        {/* Pivot screw */}
        <circle cx="46" cy="44" r="4" fill="#D4AF37" />
        <circle cx="46" cy="44" r="2" fill="#09090b" />

        {/* Snip sparkle at blade tips */}
        <g style={{ animation: 'golden-pulse 1.5s ease-in-out infinite' }}>
          <line x1="100" y1="42" x2="106" y2="42" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <line x1="103" y1="39" x2="103" y2="45" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}

function NailsAnimation() {
  return (
    <div className="w-32 h-32 flex items-center justify-center relative">
      <svg viewBox="0 0 100 100" className="w-28 h-28" style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))' }}>
        {/* Nail polish bottle */}
        <rect x="44" y="20" width="12" height="5" rx="1.5" fill="#D4AF37" opacity="0.9" />
        <rect x="42" y="25" width="16" height="28" rx="3" fill="#D4AF37" />
        {/* Gloss highlight */}
        <rect x="44" y="27" width="4" height="14" rx="2" fill="#F0D060" opacity="0.5"
          style={{ animation: 'nail-gloss 2s ease-in-out infinite' }} />

        {/* Nail brush */}
        <line x1="50" y1="53" x2="50" y2="72" stroke="#9A7D20" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="50" cy="74" rx="3" ry="5" fill="#D4AF37" opacity="0.9" />

        {/* Polish drip from brush tip */}
        <ellipse cx="50" cy="80" rx="2" ry="1.5" fill="#D4AF37"
          style={{ animation: 'polish-drip 1.8s ease-in-out infinite' }} />

        {/* Painted nail shape on right */}
        <path d="M64 60 Q64 52 72 52 Q80 52 80 60 L78 76 Q78 80 72 80 Q66 80 66 76 Z"
          fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.5" />
        {/* Painting stroke on nail */}
        <path d="M69 56 Q72 54 75 56 L74 72 Q72 74 70 72 Z"
          fill="#D4AF37" opacity="0"
          style={{
            strokeDasharray: 120,
            strokeDashoffset: 120,
            animation: 'brush-stroke 2.4s ease-out infinite',
          }} />
        <path d="M69 56 Q72 54 75 56 L74 72 Q72 74 70 72 Z"
          fill="none" stroke="#F0D060" strokeWidth="1.5"
          style={{
            strokeDasharray: 120,
            strokeDashoffset: 120,
            animation: 'brush-stroke 2.4s ease-out infinite',
          }} />

        {/* Sparkles */}
        <g style={{ animation: 'golden-pulse 1.8s ease-in-out infinite' }}>
          <line x1="85" y1="48" x2="91" y2="48" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <line x1="88" y1="45" x2="88" y2="51" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <line x1="18" y1="66" x2="22" y2="66" stroke="#F0D060" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <line x1="20" y1="64" x2="20" y2="68" stroke="#F0D060" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
}

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [animationType, setAnimationType] = useState<'scissors' | 'nails'>('scissors');

  useEffect(() => {
    // Randomize only on client to avoid hydration mismatch
    setAnimationType(Math.random() < 0.5 ? 'scissors' : 'nails');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setDone(true);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 1.8;
      });
    }, 25);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950"
      style={{ opacity: done ? 0 : 1, transition: 'opacity 0.5s ease' }}
    >
      <div
        className="flex flex-col items-center gap-6"
        style={{
          opacity: progress > 8 ? 1 : 0,
          transform: `translateY(${progress > 8 ? 0 : 14}px)`,
          transition: 'opacity 0.9s ease, transform 0.9s ease',
        }}
      >
        {/* Animation */}
        {animationType === 'scissors' ? <ScissorsAnimation /> : <NailsAnimation />}

        {/* Logo */}
        <img
          src="/BAS.svg"
          alt="Angel Beauty Studio"
          className="w-56 h-auto object-contain"
          style={{ filter: 'drop-shadow(0 0 16px rgba(212,175,55,0.35))' }}
        />

        {/* Progress bar */}
        <div className="w-36 h-px bg-zinc-800 relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full transition-all duration-75"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #9A7D20, #D4AF37, #F0D060)',
              boxShadow: '0 0 12px rgba(212,175,55,0.8)',
            }}
          />
        </div>

        <p className="text-[10px] tracking-[0.6em] text-zinc-600 uppercase">
          {progress < 45 ? 'Welcome' : progress < 85 ? 'Preparing' : 'Ready'}
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import Navbar from '@/components/Navbar';
import {
  ServicesHighlight,
  TeamPreview,
  StatsSection,
  BookingCTA,
} from '@/components/HeroSections';
import ScrollVideoSection from '@/components/ScrollVideoSection';
import Footer from '@/components/Footer';

export default function Home() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      <div className={loaded ? 'opacity-100 transition-opacity duration-700' : 'opacity-0'}>
        <Navbar />
        <main>
          <ScrollVideoSection />
          <StatsSection />
          <ServicesHighlight />
          <TeamPreview />
          <BookingCTA />
        </main>
        <Footer />
      </div>
    </>
  );
}

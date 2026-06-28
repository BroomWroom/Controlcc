'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import CubeLoader from '@/components/CubeLoader';
import { AnimatePresence } from 'framer-motion';

const DashboardGrid = dynamic(() => import('@/components/DashboardGrid'), {
  ssr: false,
});

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <main style={{ width: '100vw', minHeight: '100vh', background: 'var(--background)' }}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <CubeLoader key="loader" onComplete={() => setIsLoading(false)} />
        ) : (
          <DashboardGrid key="dashboard" />
        )}
      </AnimatePresence>
    </main>
  );
}

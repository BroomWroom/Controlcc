'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CubeLoader from '@/components/CubeLoader';
import { AnimatePresence } from 'framer-motion';
import { useContestStore } from '@/store/useContestStore';

const DashboardGrid = dynamic(() => import('@/components/DashboardGrid'), {
  ssr: false,
});

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useContestStore();
  const [prevUser, setPrevUser] = useState<string | null>(null);

  useEffect(() => {
    if (prevUser === null && currentUser !== null) {
      setIsLoading(true);
    }
    setPrevUser(currentUser);
  }, [currentUser, prevUser]);

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

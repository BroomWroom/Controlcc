'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './CubeLoader.css';

const STATUS_TEXTS = [
  'Initializing Systems...',
  'Fetching Contest Ranks...',
  'Connecting to Standings Engine...',
  'Decrypting Scoreboard...',
  'Readying Command Deck...'
];

export default function CubeLoader({ onComplete }: { onComplete: () => void }) {
  const [statusIdx, setStatusIdx] = useState(0);

  // Cycle status text every 800ms
  useEffect(() => {
    const textInterval = setInterval(() => {
      setStatusIdx((prev) => (prev < STATUS_TEXTS.length - 1 ? prev + 1 : prev));
    }, 850);

    return () => clearInterval(textInterval);
  }, []);

  // Complete loading after 4.2 seconds (gives enough time to showcase the beautiful animation)
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Color layers: h=1 (Red/Orange/Amber), h=2 (Cyan/Blue/Emerald), h=3 (Purple/Pink/Indigo)
  const getFaceStyles = (h: number, position: 'top' | 'left' | 'right') => {
    if (h === 1) {
      if (position === 'top') return { background: 'linear-gradient(135deg, #f59e0b, #d97706)' };
      if (position === 'left') return { background: 'linear-gradient(135deg, #ef4444, #b91c1c)' };
      return { background: 'linear-gradient(135deg, #f97316, #c2410c)' };
    } else if (h === 2) {
      if (position === 'top') return { background: 'linear-gradient(135deg, #06b6d4, #0891b2)' };
      if (position === 'left') return { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' };
      return { background: 'linear-gradient(135deg, #10b981, #047857)' };
    } else {
      if (position === 'top') return { background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' };
      if (position === 'left') return { background: 'linear-gradient(135deg, #ec4899, #be185d)' };
      return { background: 'linear-gradient(135deg, #6366f1, #4338ca)' };
    }
  };

  return (
    <motion.div 
      className="loader-wrapper"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="loader-container">
        {[1, 2, 3].map((h) => (
          <div key={h} className={`h${h}Container`}>
            {[1, 2, 3].map((w) =>
              [1, 2, 3].map((l) => (
                <div key={`${h}-${w}-${l}`} className={`loader-cube h${h} w${w} l${l}`}>
                  <div className="loader-face top" style={getFaceStyles(h, 'top')} />
                  <div className="loader-face left" style={getFaceStyles(h, 'left')} />
                  <div className="loader-face right" style={getFaceStyles(h, 'right')} />
                </div>
              ))
            )}
          </div>
        ))}
      </div>
      
      <div className="loader-text">
        {STATUS_TEXTS[statusIdx]}
      </div>
    </motion.div>
  );
}

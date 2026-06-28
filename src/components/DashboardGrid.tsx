'use client';

import React, { useState, useEffect } from 'react';
import { useContestSimulator } from '../hooks/useContestSimulator';
import CountdownDial from './CountdownDial';
import OverviewStats from './OverviewStats';
import Leaderboard from './Leaderboard';
import ActivityFeed from './ActivityFeed';
import ParticipantTable from './ParticipantTable';
import Submissions from './Submissions';
import AnalyticsPanel from './AnalyticsPanel';
import SecurityPanel from './SecurityPanel';
import AdminAuthModal from './AdminAuthModal';
import { useContestStore } from '../store/useContestStore';
import { Reorder, useDragControls, AnimatePresence, motion } from 'framer-motion';
import { GripVertical, Play, Pause, RefreshCw, AlertTriangle, Sparkles } from 'lucide-react';

interface WidgetItemProps {
  id: string;
  children: React.ReactNode;
}

interface ConfettiParticle {
  id: number;
  color: string;
  size: number;
  tx: number;
  ty: number;
  rotate: number;
}

// Custom wrapper to restrict dragging strictly to the drag handle
function WidgetItem({ id, children }: WidgetItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item 
      value={id} 
      dragListener={false} 
      dragControls={dragControls}
      style={{ 
        width: '100%', 
        position: 'relative',
        listStyle: 'none'
      }}
      whileDrag={{ 
        scale: 1.01,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        zIndex: 50
      }}
    >
      {/* Drag Grip Handle */}
      <div 
        className="drag-handle-grip"
        onPointerDown={(e) => dragControls.start(e)}
        style={{
          position: 'absolute',
          top: '6px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 15,
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '4px',
          padding: '2px 8px',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <GripVertical size={12} />
      </div>
      
      {children}
    </Reorder.Item>
  );
}

export default function DashboardGrid() {
  // Start the background contest simulator
  useContestSimulator();

  const { 
    timeRemaining, 
    rewindMinute, 
    setRewindMinute, 
    latestFirstBlood, 
    clearLatestFirstBlood,
    totalContestMinutes
  } = useContestStore();

  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [isPlayingRewind, setIsPlayingRewind] = useState(false);

  // Compute elapsed minutes from live timer
  const elapsedMinutes = Math.floor((5400 - timeRemaining) / 60);

  // Replay slider spans the full configured contest duration (e.g. 90 min)
  // Updates dynamically when admin edits contest time via the pencil button
  const maxReplayMinute = totalContestMinutes;

  const DEFAULT_ORDER = [
    'timer',
    'stats',
    'leaderboard-section',
    'submissions',
    'security',
    'participants',
    'analytics'
  ];

  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard_widget_order');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) {
            return parsed;
          }
        } catch (e) {
          console.error('Failed to load widget order', e);
        }
      }
    }
    return DEFAULT_ORDER;
  });

  // 1. Particle Confetti & Toast Effect on First Blood
  useEffect(() => {
    if (latestFirstBlood) {
      const newParticles = Array.from({ length: 80 }).map((_, idx) => {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 300 + 150;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        const colorsList = [
          'var(--accent-emerald)',
          'var(--accent-cyan)',
          'var(--accent-amber)',
          'var(--accent-blue)',
          'var(--accent-purple)',
        ];
        return {
          id: Date.now() + idx,
          color: colorsList[Math.floor(Math.random() * colorsList.length)],
          size: Math.random() * 8 + 6,
          tx,
          ty,
          rotate: Math.random() * 720 - 360,
        };
      });
      setParticles(newParticles);
      setShowToast(true);

      const timer = setTimeout(() => {
        setShowToast(false);
        setParticles([]);
        clearLatestFirstBlood();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [latestFirstBlood, clearLatestFirstBlood]);

  // 2. Timeline autoplay simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingRewind && rewindMinute !== null) {
      timer = setInterval(() => {
        if (rewindMinute < maxReplayMinute) {
          setRewindMinute(rewindMinute + 1);
        } else {
          setIsPlayingRewind(false);
        }
      }, 600);
    }
    return () => clearInterval(timer);
  }, [isPlayingRewind, rewindMinute, maxReplayMinute, setRewindMinute]);

  const handlePlayPause = () => {
    if (isPlayingRewind) {
      setIsPlayingRewind(false);
    } else {
      // If we're at the end or no rewind active, restart from minute 0
      if (rewindMinute === null || rewindMinute >= maxReplayMinute) {
        setRewindMinute(0);
      }
      setIsPlayingRewind(true);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlayingRewind(false);
    const val = Number(e.target.value);
    setRewindMinute(val);
  };

  const handleLiveSync = () => {
    setIsPlayingRewind(false);
    setRewindMinute(null);
  };

  // Save layout preferences to localStorage
  const handleReorder = (newOrder: string[]) => {
    setWidgetOrder(newOrder);
    localStorage.setItem('dashboard_widget_order', JSON.stringify(newOrder));
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'timer':
        return <CountdownDial />;
      case 'stats':
        return <OverviewStats />;
      case 'leaderboard-section':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', width: '100%' }}>
            <Leaderboard />
            <ActivityFeed />
          </div>
        );
      case 'submissions':
        return <Submissions />;
      case 'security':
        return <SecurityPanel />;
      case 'participants':
        return <ParticipantTable />;
      case 'analytics':
        return <AnalyticsPanel />;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '7rem' }}>
      
      {/* Global Drag-and-Drop Reorder Group */}
      <Reorder.Group 
        axis="y" 
        values={widgetOrder} 
        onReorder={handleReorder}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          padding: '1.5rem',
          maxWidth: '1600px',
          margin: '0 auto',
          width: '100%',
          listStyleType: 'none'
        }}
      >
        {widgetOrder.map((id) => (
          <WidgetItem key={id} id={id}>
            {renderWidget(id)}
          </WidgetItem>
        ))}
      </Reorder.Group>

      {/* Custom Particle Confetti Container */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{
              x: p.tx,
              y: [0, p.ty - 120, p.ty + 250],
              opacity: [1, 1, 0],
              scale: [1, 1.2, 0.3],
              rotate: p.rotate
            }}
            transition={{
              duration: 3,
              ease: [0.1, 0.8, 0.3, 1]
            }}
          />
        ))}
      </div>

      {/* First Blood Toast Notification */}
      <AnimatePresence>
        {showToast && latestFirstBlood && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: '2rem',
              right: '2rem',
              zIndex: 10000,
              background: 'rgba(16, 20, 30, 0.95)',
              border: '1px solid var(--accent-emerald)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              width: '320px',
              pointerEvents: 'auto',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Sparkles size={16} color="var(--accent-emerald)" className="blink-animation" />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                First Blood Registered
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
              <strong>{latestFirstBlood.participantName}</strong> solved Problem <strong>{latestFirstBlood.problemCode}</strong> first!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Contest Rewind Timeline Dock */}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '850px',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)',
        zIndex: 90,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease'
      }}>
        {/* Warning Banner inside the dock */}
        {rewindMinute !== null && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '0.4rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.7rem',
            color: 'var(--accent-amber)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            <AlertTriangle size={12} className="blink-animation" />
            Timeline Rewind Active - Standings frozen at Minute {rewindMinute}
          </div>
        )}

        {/* Timeline Control Row */}
        <div className="timeline-control-row">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className="btn"
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.75rem',
              background: isPlayingRewind ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              border: `1px solid ${isPlayingRewind ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              color: isPlayingRewind ? 'var(--accent-red)' : 'var(--accent-blue)',
              minWidth: '70px',
              justifyContent: 'center',
              fontWeight: 700
            }}
          >
            {isPlayingRewind ? <Pause size={12} /> : <Play size={12} />}
            {isPlayingRewind ? 'Pause' : 'Play'}
          </button>

          {/* Time indicator */}
          <div className="mono-font" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '150px' }}>
            {rewindMinute !== null ? `Min ${rewindMinute}` : 'Live Standings'}
            <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
              / {maxReplayMinute}m
            </span>
          </div>

          {/* Slider input */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="mono-font" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', minWidth: '20px', textAlign: 'right' }}>0</span>
            <input
              type="range"
              min="0"
              max={Math.max(1, maxReplayMinute)}
              value={rewindMinute !== null ? rewindMinute : maxReplayMinute}
              onChange={handleSliderChange}
              style={{
                flex: 1,
                accentColor: rewindMinute !== null ? 'var(--accent-amber)' : 'var(--accent-blue)',
                height: '6px',
                borderRadius: '3px',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.1)'
              }}
            />
            <span className="mono-font" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', minWidth: '30px' }}>{maxReplayMinute}m</span>
          </div>

          {/* Live Sync button */}
          <button
            onClick={handleLiveSync}
            disabled={rewindMinute === null}
            className="btn"
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.75rem',
              background: rewindMinute === null ? 'rgba(255, 255, 255, 0.03)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${rewindMinute === null ? 'transparent' : 'rgba(16, 185, 129, 0.3)'}`,
              color: rewindMinute === null ? 'var(--text-muted)' : 'var(--accent-emerald)',
              fontWeight: 700,
              cursor: rewindMinute === null ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={12} className={rewindMinute === null ? '' : 'spin-slow-animation'} />
            Live Sync
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        marginTop: 'auto', 
        padding: '2rem 1.5rem', 
        borderTop: '1px solid var(--card-border)', 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        color: 'var(--text-secondary)',
        background: 'var(--card-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div>
          © 2026 <strong>CodeChef VIT</strong>. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>Developer: <strong>Tanishq Walture</strong></span>
          <span style={{ color: 'var(--card-border)' }}>|</span>
          <a href="https://github.com/BroomWroom" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>GitHub</a>
          <span style={{ color: 'var(--card-border)' }}>|</span>
          <a href="https://tanishwalture.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Portfolio</a>
          <span style={{ color: 'var(--card-border)' }}>|</span>
          <span>CodeChef Contest Operations Center</span>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-slow-animation {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>

      {/* Global Security Prompt Gate Modal */}
      <AdminAuthModal />
    </div>
  );
}

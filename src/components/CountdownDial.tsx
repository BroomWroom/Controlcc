'use client';

import React, { useState } from 'react';
import { useContestStore } from '../store/useContestStore';
import { Shield, Play, Pause, RotateCcw, Snowflake, Flame, Sun, Moon, Pencil, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import GradientText from './GradientText';
import BorderGlow from './BorderGlow';
import Image from 'next/image';

export default function CountdownDial() {
  const { 
    timeRemaining, 
    contestStatus, 
    freezeMode, 
    toggleFreezeMode, 
    resetContest,
    setContestStatus,
    setContestTime
  } = useContestStore();

  const [isCoverOpen, setIsCoverOpen] = useState(false);
  const [isThemeLight, setIsThemeLight] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(90);



  // Format time (seconds to hh:mm:ss)
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].join(':');
  };

  const toggleTheme = () => {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('light')) {
      htmlElement.classList.remove('light');
      setIsThemeLight(false);
    } else {
      htmlElement.classList.add('light');
      setIsThemeLight(true);
    }
  };

  // Status-based formatting
  const timeStr = formatTime(timeRemaining);
  const isCritical = timeRemaining < 600 && contestStatus === 'Live'; // final 10 mins

  return (
    <div className="col-12" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Standalone Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingLeft: '0.25rem' }}>
        <div style={{
          position: 'relative',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '8px',
          padding: '2px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Image 
            src="/codechef-vit-logo.png" 
            alt="CodeChef VIT Logo" 
            width={26}
            height={26}
            style={{ 
              objectFit: 'contain',
              borderRadius: '6px'
            }} 
          />
        </div>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
          <GradientText
            colors={["#f97316", "#ef4444", "#f59e0b", "#ef4444", "#f97316"]}
            animationSpeed={4}
            showBorder={false}
            className="mono-font"
          >
            CodeChef VIT
          </GradientText>
        </span>
      </div>

      {/* Main Control Card */}
      <BorderGlow animated={true}>
        <header style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', width: '100%', background: 'transparent' }}>
          {/* Left: Operational Title */}
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Contest Control Center</span>
              <span style={{ 
                fontSize: '0.65rem', 
                background: contestStatus === 'Live' ? 'var(--glow-emerald)' : 'var(--card-border)', 
                color: contestStatus === 'Live' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                padding: '0.15rem 0.4rem', 
                borderRadius: '4px',
                border: contestStatus === 'Live' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginLeft: '0.25rem'
              }}>
                {contestStatus}
              </span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Organizer Panel
            </p>
          </div>

      {/* Center Console: Timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="mono-font" style={{ 
            fontSize: '2rem', 
            fontWeight: 700, 
            letterSpacing: '0.05em',
            color: isCritical 
              ? 'var(--accent-red)' 
              : freezeMode 
                ? 'var(--accent-blue)' 
                : 'var(--text-primary)',
            textShadow: isCritical 
              ? '0 0 10px var(--glow-red)' 
              : freezeMode 
                ? '0 0 10px var(--glow-blue)' 
                : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            lineHeight: 1
          }}>
            {isEditingTime ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                <input 
                  type="number" 
                  min="1" 
                  max="1440" 
                  value={inputMinutes} 
                  onChange={(e) => setInputMinutes(Math.max(1, Number(e.target.value)))}
                  className="input-field mono-font"
                  style={{ 
                    width: '80px', 
                    height: '32px', 
                    fontSize: '1.25rem', 
                    fontWeight: 700, 
                    padding: '0 0.25rem', 
                    textAlign: 'center',
                    border: '1px solid var(--accent-blue)',
                    borderRadius: '4px',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--text-primary)'
                  }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setContestTime(inputMinutes);
                      setIsEditingTime(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingTime(false);
                      setInputMinutes(Math.round(timeRemaining / 60));
                    }
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>min</span>
                
                <button 
                  onClick={() => {
                    setContestTime(inputMinutes);
                    setIsEditingTime(false);
                  }}
                  className="btn"
                  style={{ padding: '0.35rem', background: 'var(--accent-emerald)', color: '#fff', border: 'none', borderRadius: '4px', display: 'flex' }}
                  title="Save Time"
                >
                  <Check size={12} />
                </button>
                <button 
                  onClick={() => {
                    setIsEditingTime(false);
                    setInputMinutes(Math.round(timeRemaining / 60));
                  }}
                  className="btn"
                  style={{ padding: '0.35rem', background: 'var(--card-border)', border: 'none', borderRadius: '4px', display: 'flex' }}
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <>
                {timeStr}
                <button 
                  onClick={() => {
                    setInputMinutes(Math.round(timeRemaining / 60));
                    setIsEditingTime(true);
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'var(--text-muted)',
                    display: 'flex',
                    padding: '0.25rem',
                    opacity: 0.6,
                    transition: 'opacity 0.2s',
                    marginLeft: '0.25rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                  title="Edit Contest Duration"
                >
                  <Pencil size={12} />
                </button>
              </>
            )}
          </div>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            CONTEST COUNTDOWN
          </span>
        </div>

        {/* Quick Admin Actions */}
        <div style={{ display: 'flex', gap: '0.35rem', borderLeft: '1px solid var(--card-border)', paddingLeft: '1.25rem' }}>
          {contestStatus === 'Live' ? (
            <button 
              className="btn" 
              onClick={() => setContestStatus('Ended')} 
              title="End Contest"
              style={{ padding: '0.4rem' }}
            >
              <Pause size={14} />
            </button>
          ) : contestStatus === 'Ended' ? (
            <button 
              className="btn" 
              onClick={() => setContestStatus('Live')} 
              title="Restart Contest"
              style={{ padding: '0.4rem' }}
            >
              <Play size={14} />
            </button>
          ) : null}
          
          <button 
            className="btn" 
            onClick={resetContest} 
            title="Reset Simulation Data"
            style={{ padding: '0.4rem', color: 'var(--accent-red)' }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Signature Element: Mechanical Freeze Standings Switch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Toggle Theme */}
        <button className="btn" onClick={toggleTheme} style={{ padding: '0.5rem', borderRadius: '50%' }}>
          {isThemeLight ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'rgba(0,0,0,0.2)', 
          border: '1px solid var(--card-border)',
          borderRadius: '10px', 
          padding: '0.35rem 0.75rem',
          gap: '0.75rem',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rankings Freeze
            </span>
            <span className="mono-font" style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: freezeMode ? 'var(--accent-blue)' : 'var(--text-secondary)' 
            }}>
              {freezeMode ? 'FROZEN' : 'ACTIVE'}
            </span>
          </div>

          {/* Safety Cover Switch Assembly */}
          <div style={{ position: 'relative', width: '70px', height: '34px', display: 'flex', alignItems: 'center' }}>
            
            {/* The switch button base */}
            <button 
              disabled={!isCoverOpen}
              onClick={toggleFreezeMode}
              className="mono-font"
              style={{
                width: '100%',
                height: '24px',
                borderRadius: '4px',
                border: 'none',
                background: freezeMode 
                  ? 'linear-gradient(to right, #1d4ed8, #3b82f6)' 
                  : 'linear-gradient(to right, #334155, #475569)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.65rem',
                cursor: isCoverOpen ? 'pointer' : 'not-allowed',
                opacity: isCoverOpen ? 1 : 0.6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                transition: 'all 0.2s',
                boxShadow: freezeMode ? '0 0 8px rgba(59, 130, 246, 0.4)' : 'none'
              }}
            >
              {freezeMode ? <Flame size={10} /> : <Snowflake size={10} />}
              {freezeMode ? 'THAW' : 'FREEZE'}
            </button>

            {/* Glass Cover */}
            <motion.div
              onClick={() => setIsCoverOpen(!isCoverOpen)}
              title={isCoverOpen ? "Close safety cover" : "Flip open safety cover"}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.6)',
                borderRadius: '6px',
                backdropFilter: 'blur(1px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transformOrigin: 'top center',
                zIndex: 2,
                boxShadow: 'inset 0 0 4px rgba(239, 68, 68, 0.4)'
              }}
              animate={{ 
                rotateX: isCoverOpen ? -110 : 0,
                y: isCoverOpen ? -6 : 0,
                opacity: isCoverOpen ? 0.9 : 1
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Shield size={12} color="#ef4444" style={{ filter: 'drop-shadow(0 0 2px rgba(239,68,68,0.5))' }} />
            </motion.div>
          </div>
        </div>
      </div>
      </header>
      </BorderGlow>
    </div>
  );
}

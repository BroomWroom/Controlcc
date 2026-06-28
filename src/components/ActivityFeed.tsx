'use client';

import React from 'react';
import { useContestStore } from '../store/useContestStore';
import { Activity, UserPlus, Code2, Snowflake, Flame, RotateCcw, Target, ShieldAlert, Droplet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BorderGlow from './BorderGlow';

export default function ActivityFeed() {
  const { activities, rewindMinute } = useContestStore();

  // Filter activities based on timeline rewind if active
  const displayActivities = rewindMinute !== null
    ? activities.filter((act) => act.contestMinutes === undefined || act.contestMinutes <= rewindMinute)
    : activities;

  const getActivityIcon = (act: any) => {
    const desc = act.description.toUpperCase();
    if (desc.includes('SNIPER MODE')) {
      return <Target size={14} color="var(--accent-red)" className="blink-animation" />;
    }
    if (desc.includes('FIRST BLOOD')) {
      return <Droplet size={14} color="var(--accent-red)" />;
    }
    if (desc.includes('SECURITY') || desc.includes('PLAGIARISM') || desc.includes('ANOMALY')) {
      return <ShieldAlert size={14} color="var(--accent-amber)" />;
    }

    switch (act.type) {
      case 'JOIN':
        return <UserPlus size={14} color="var(--accent-emerald)" />;
      case 'SUBMIT':
        return <Code2 size={14} color="var(--accent-cyan)" />;
      case 'REJUDGE':
        return <RotateCcw size={14} color="var(--accent-purple)" />;
      case 'FREEZE':
        return <Snowflake size={14} color="var(--accent-blue)" className="blink-animation" />;
      case 'UNFREEZE':
        return <Flame size={14} color="var(--accent-red)" />;
      default:
        return <Activity size={14} color="var(--text-muted)" />;
    }
  };

  const formatActivityTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <BorderGlow className="col-4">
      <div style={{ display: 'flex', flexDirection: 'column', height: '480px', padding: '1.25rem', width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Activity size={18} color="var(--accent-cyan)" />
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
          Operations Activity Feed
        </h2>
      </div>

      {/* Activities list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
        {displayActivities.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '3rem', fontSize: '0.85rem' }}>
            No activities recorded yet.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {displayActivities.map((act) => {
              const isSniper = act.description.includes('SNIPER MODE');
              const isFirstBlood = act.description.includes('FIRST BLOOD');
              const isSecurity = act.description.includes('SECURITY');
              
              let cardBg = 'rgba(0,0,0,0.15)';
              let cardBorder = 'var(--card-border)';
              
              if (isSniper) {
                cardBg = 'rgba(239, 68, 68, 0.05)';
                cardBorder = 'rgba(239, 68, 68, 0.25)';
              } else if (isFirstBlood) {
                cardBg = 'rgba(16, 185, 129, 0.03)';
                cardBorder = 'rgba(16, 185, 129, 0.2)';
              } else if (isSecurity) {
                cardBg = 'rgba(245, 158, 11, 0.05)';
                cardBorder = 'rgba(245, 158, 11, 0.25)';
              }

              return (
                <motion.div
                  key={act.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    padding: '0.65rem 0.75rem',
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    boxShadow: isSniper ? '0 0 10px rgba(239, 68, 68, 0.05)' : 'none'
                  }}
                >
                  <div style={{ 
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '6px',
                    padding: '0.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '1px'
                  }}>
                    {getActivityIcon(act)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: isSniper 
                        ? 'var(--text-primary)' 
                        : isFirstBlood 
                          ? 'var(--accent-emerald)' 
                          : isSecurity 
                            ? 'var(--accent-amber)' 
                            : 'var(--text-primary)', 
                      lineHeight: 1.35,
                      fontWeight: (isSniper || isFirstBlood || isSecurity) ? 600 : 500
                    }}>
                      {act.description}
                    </div>
                    <div className="mono-font" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {formatActivityTime(act.timestamp)}
                      {act.contestMinutes !== undefined && ` • min ${act.contestMinutes}`}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
      </div>
    </BorderGlow>
  );
}

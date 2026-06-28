'use client';

import React from 'react';
import { useContestStore, calculateStandings } from '../store/useContestStore';
import { Snowflake, Award, Flame, Target, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BorderGlow from './BorderGlow';

export default function Leaderboard() {
  const { 
    participants, 
    frozenLeaderboard, 
    freezeMode, 
    problems, 
    submissions, 
    timeRemaining, 
    sandboxSimulation, 
    setSandboxSimulation,
    rewindMinute
  } = useContestStore();

  const [sandboxUser, setSandboxUser] = React.useState('');
  const [sandboxProblem, setSandboxProblem] = React.useState('');

  // 1. Filter submissions based on rewindMinute if active
  const displaySubmissions = rewindMinute !== null 
    ? submissions.filter((s) => s.timestamp <= rewindMinute)
    : submissions;

  // 2. Inject simulation if active
  const simulationSubmissions = sandboxSimulation
    ? [
        ...displaySubmissions,
        {
          id: 'sandbox_sim_sub',
          participantName: sandboxSimulation.name,
          problemCode: sandboxSimulation.problemCode,
          problemName: problems.find(p => p.code === sandboxSimulation.problemCode)?.title || '',
          timestamp: rewindMinute !== null ? rewindMinute : Math.floor((5400 - timeRemaining) / 60),
          verdict: 'Accepted' as const,
          language: 'C++' as const,
          executionTime: 0.05
        }
      ]
    : displaySubmissions;

  // 3. Compute display list
  const computedList = calculateStandings(participants, simulationSubmissions, problems);
  const displayList = freezeMode && frozenLeaderboard && !sandboxSimulation ? frozenLeaderboard : computedList;

  // Streak Detector: checks if a user is "on fire"
  const hasStreak = (participantName: string) => {
    // Only look at submissions within the timeline bounds
    const pSubs = displaySubmissions
      .filter((s) => s.participantName === participantName && s.verdict !== 'Pending' && s.verdict !== 'Running')
      .sort((a, b) => b.timestamp - a.timestamp);
    
    // Streak condition 1: last 2 non-pending are Accepted
    if (pSubs.length >= 2 && pSubs[0].verdict === 'Accepted' && pSubs[1].verdict === 'Accepted') {
      return true;
    }
    
    // Streak condition 2: solved 2 problems in the last 15 minutes of contest elapsed time
    const elapsedMinutes = rewindMinute !== null ? rewindMinute : Math.floor((5400 - timeRemaining) / 60);
    const recentAcCount = pSubs.filter(
      (s) => s.verdict === 'Accepted' && (elapsedMinutes - s.timestamp <= 15)
    ).length;
    
    return recentAcCount >= 2;
  };

  // CSV Export handler
  const exportToCSV = () => {
    const sanitizeCSVField = (val: any) => {
      const str = String(val);
      if (/^[=\+\-\@\t\r]/.test(str)) {
        return `'${str}`;
      }
      return str;
    };

    const headers = ['Rank', 'Name', 'Institution', 'Solved', 'Penalty Time', ...problems.map(p => `Prob_${p.code}`)];
    const rows = displayList.map(p => {
      const probData = problems.map(prob => {
        const attempt = p.problemAttempts[prob.code];
        if (!attempt) return '';
        if (attempt.solvedTime !== null) {
          return `Accepted (+${attempt.attempts}) at ${attempt.solvedTime}m`;
        }
        return attempt.attempts > 0 ? `Failed (-${attempt.attempts})` : '';
      });
      return [
        p.rank,
        p.name,
        p.institution,
        p.solvedCount,
        p.penaltyTime,
        ...probData
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.map(val => `"${sanitizeCSVField(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contest_leaderboard_${freezeMode ? 'frozen' : 'live'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <BorderGlow className="col-8" colors={sandboxSimulation ? ['var(--accent-cyan)', 'var(--accent-emerald)', 'rgba(6, 182, 212, 0.3)'] : undefined}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '480px', padding: '1.25rem', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} color="var(--accent-amber)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Contest Leaderboard
            {freezeMode && (
              <span className="mono-font" style={{ 
                fontSize: '0.65rem', 
                background: 'var(--glow-blue)', 
                color: 'var(--accent-blue)', 
                padding: '0.15rem 0.4rem', 
                borderRadius: '4px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontWeight: 700
              }}>
                <Snowflake size={10} className="blink-animation" /> FROZEN STANDINGS
              </span>
            )}
          </h2>
        </div>

        <button className="btn" onClick={exportToCSV} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
          Export CSV
        </button>
      </div>

      {/* Sandbox Control Bar */}
      <div style={{
        background: sandboxSimulation ? 'rgba(6, 182, 212, 0.08)' : 'rgba(30, 41, 59, 0.2)',
        border: sandboxSimulation ? '1px solid rgba(6, 182, 212, 0.3)' : '1px dashed var(--card-border)',
        borderRadius: '8px',
        padding: '0.5rem 0.85rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Target size={14} color={sandboxSimulation ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: sandboxSimulation ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
            Leaderboard Sandbox
          </span>
        </div>
        
        {sandboxSimulation ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
              Simulating: <strong style={{ color: 'var(--accent-cyan)' }}>{sandboxSimulation.name}</strong> solves <strong style={{ color: 'var(--accent-cyan)' }}>Problem {sandboxSimulation.problemCode}</strong>
            </span>
            <button 
              className="btn" 
              onClick={() => {
                setSandboxSimulation(null);
                setSandboxUser('');
                setSandboxProblem('');
              }}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            >
              Reset Sandbox
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select 
              value={sandboxUser}
              onChange={(e) => setSandboxUser(e.target.value)}
              style={{ background: 'var(--background)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', padding: '0.25rem', borderRadius: '4px', fontSize: '0.75rem' }}
            >
              <option value="" disabled>Select Participant</option>
              {participants.filter(p => p.status !== 'Disqualified').map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            <select 
              value={sandboxProblem}
              onChange={(e) => setSandboxProblem(e.target.value)}
              style={{ background: 'var(--background)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', padding: '0.25rem', borderRadius: '4px', fontSize: '0.75rem' }}
            >
              <option value="" disabled>Select Problem</option>
              {problems.map(prob => {
                return (
                  <option key={prob.code} value={prob.code}>{prob.code}: {prob.title}</option>
                );
              })}
            </select>
            <button 
              className="btn" 
              onClick={() => {
                if (sandboxUser && sandboxProblem) {
                  setSandboxSimulation({ name: sandboxUser, problemCode: sandboxProblem });
                }
              }}
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', background: 'var(--accent-cyan)', color: '#080a0f', border: 'none', fontWeight: 700, borderRadius: '4px' }}
            >
              Preview outcome
            </button>
          </div>
        )}
      </div>

      {/* Main Leaderboard Table Container */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Frost Visual Overlay if Frozen */}
        <AnimatePresence>
          {freezeMode && !sandboxSimulation && (
            <motion.div 
              className="frost-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                pointerEvents: 'none',
                border: '2px solid rgba(59, 130, 246, 0.4)',
                background: 'rgba(9, 11, 15, 0.05)',
                display: 'block'
              }}
            >
              {/* Floating Frost Indicator */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                background: 'var(--card-bg)',
                border: '1px solid var(--frost-border)',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                zIndex: 11,
                pointerEvents: 'auto'
              }}>
                <Snowflake size={18} color="var(--accent-blue)" className="blink-animation" />
                <span className="mono-font" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                  STANDINGS LOCKED
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="data-table-container" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '55px', textAlign: 'center' }}>Rank</th>
                <th>Participant</th>
                <th style={{ width: '150px' }}>Institution</th>
                {problems.map((prob) => (
                  <th key={prob.code} style={{ width: '60px', textAlign: 'center' }} title={`${prob.code}: ${prob.title}`}>
                    {prob.code}
                  </th>
                ))}
                <th style={{ width: '60px', textAlign: 'center' }}>Solved</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Penalty</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map((p) => {
                const isTopThree = p.rank > 0 && p.rank <= 3;
                const isSimulated = sandboxSimulation?.name === p.name;
                const isDq = p.status === 'Disqualified';
                
                let rowBg = 'transparent';
                let rowBorder = 'none';
                
                if (isDq) {
                  rowBg = 'rgba(239, 68, 68, 0.02)';
                } else if (isSimulated) {
                  rowBg = 'rgba(6, 182, 212, 0.04)';
                  rowBorder = '1px solid rgba(6, 182, 212, 0.3)';
                } else if (isTopThree) {
                  rowBg = p.rank === 1 
                    ? 'rgba(245, 158, 11, 0.03)' 
                    : p.rank === 2 
                      ? 'rgba(148, 163, 184, 0.03)' 
                      : 'rgba(180, 83, 9, 0.03)';
                }

                return (
                  <tr 
                    key={p.name} 
                    style={{ 
                      background: rowBg,
                      outline: rowBorder,
                      transition: 'background 0.3s ease'
                    }}
                  >
                    {/* Rank cell */}
                    <td className="mono-font" style={{ textAlign: 'center', fontWeight: isTopThree ? 700 : 500, color: isDq ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {isDq ? (
                        <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>DQ</span>
                      ) : (
                        `#${p.rank}`
                      )}
                    </td>
                    {/* Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                        <span style={{ 
                          fontWeight: 600, 
                          color: isDq ? 'var(--accent-red)' : isSimulated ? 'var(--accent-cyan)' : 'var(--text-primary)',
                          textDecoration: isDq ? 'line-through' : 'none'
                        }}>
                          {p.name}
                        </span>
                        
                        {hasStreak(p.name) && !isDq && (
                          <Flame 
                            size={14} 
                            color="var(--accent-red)" 
                            style={{ filter: 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.4))' }} 
                            className="blink-animation" 
                          />
                        )}

                        {isSimulated && (
                          <span style={{ 
                            background: 'rgba(6, 182, 212, 0.15)', 
                            color: 'var(--accent-cyan)', 
                            border: '1px solid rgba(6, 182, 212, 0.3)', 
                            padding: '0.05rem 0.25rem', 
                            borderRadius: '3px', 
                            fontSize: '0.55rem', 
                            fontWeight: 700, 
                            textTransform: 'uppercase' 
                          }}>
                            Simulated
                          </span>
                        )}
                        
                        {isDq && (
                          <span style={{ 
                            background: 'rgba(239, 68, 68, 0.15)', 
                            color: 'var(--accent-red)', 
                            border: '1px solid rgba(239, 68, 68, 0.3)', 
                            padding: '0.05rem 0.25rem', 
                            borderRadius: '3px', 
                            fontSize: '0.55rem', 
                            fontWeight: 700, 
                            textTransform: 'uppercase' 
                          }}>
                            Suspended
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Institution */}
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {p.institution}
                    </td>
                    {/* Problems Grid */}
                    {problems.map((prob) => {
                      const attempt = p.problemAttempts[prob.code];
                      
                      // For simulated solve
                      const isSimSolved = isSimulated && sandboxSimulation?.problemCode === prob.code;
                      
                      if ((!attempt || attempt.attempts === 0) && !isSimSolved) {
                        return <td key={prob.code} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>-</td>;
                      }

                      const isSolved = isSimSolved || (attempt && attempt.solvedTime !== null);
                      const attemptCount = isSimSolved ? (attempt ? attempt.attempts + 1 : 1) : attempt.attempts;
                      const solvedTime = isSimSolved 
                        ? (rewindMinute !== null ? rewindMinute : Math.floor((5400 - timeRemaining) / 60)) 
                        : attempt.solvedTime;

                      return (
                        <td 
                          key={prob.code} 
                          style={{ 
                            textAlign: 'center', 
                            padding: '0.25rem 0.5rem' 
                          }}
                        >
                          <div style={{
                            background: isSolved 
                              ? isSimSolved ? 'rgba(6, 182, 212, 0.08)' : 'var(--glow-emerald)' 
                              : 'var(--glow-red)',
                            border: isSolved 
                              ? isSimSolved 
                                ? '1px dashed rgba(6, 182, 212, 0.4)' 
                                : '1px solid rgba(16, 185, 129, 0.25)' 
                              : '1px solid rgba(239, 68, 68, 0.25)',
                            color: isSolved 
                              ? isSimSolved ? 'var(--accent-cyan)' : 'var(--accent-emerald)' 
                              : 'var(--accent-red)',
                            borderRadius: '4px',
                            padding: '0.25rem 0.15rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '38px',
                            opacity: isDq ? 0.5 : 1
                          }}>
                            <span className="mono-font" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              {isSolved ? `+${attemptCount - 1 || ''}` : `-${attemptCount}`}
                            </span>
                            {isSolved && (
                              <span className="mono-font" style={{ fontSize: '0.55rem', opacity: 0.8 }}>
                                {solvedTime}m
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    {/* Solved Count */}
                    <td className="mono-font" style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', color: isDq ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {p.solvedCount}
                    </td>
                    {/* Penalty */}
                    <td className="mono-font" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {p.penaltyTime}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </BorderGlow>
  );
}

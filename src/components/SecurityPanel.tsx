'use client';

import React from 'react';
import { useContestStore, PlagiarismFlag } from '../store/useContestStore';
import { ShieldAlert, ShieldCheck, Eye, Check, AlertTriangle, ShieldX } from 'lucide-react';
import BorderGlow from './BorderGlow';

export default function SecurityPanel() {
  const { plagiarismFlags, resolvePlagiarismFlag } = useContestStore();

  const getStatusBadge = (status: PlagiarismFlag['status']) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="badge badge-pending" style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={10} className="blink-animation" />
            UNRESOLVED
          </span>
        );
      case 'Investigated':
        return (
          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldX size={10} />
            SUSPENDED
          </span>
        );
      case 'Cleared':
        return (
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={10} />
            CLEARED
          </span>
        );
    }
  };

  return (
    <BorderGlow className="col-12" colors={plagiarismFlags.some(f => f.status === 'Pending') ? ['var(--accent-amber)', 'var(--accent-red)', 'rgba(245, 158, 11, 0.2)'] : undefined}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '320px', padding: '1.25rem', width: '100%' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} color="var(--accent-amber)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              Anomaly Scanner & Plagiarism Security
            </h2>
          </div>
          <span className="mono-font" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Total flags: {plagiarismFlags.length}
          </span>
        </div>

        {/* Scanner Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {plagiarismFlags.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '1rem', 
              padding: '3rem 1rem', 
              background: 'rgba(16, 185, 129, 0.01)',
              border: '1px dashed rgba(16, 185, 129, 0.15)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div className="pulse-animation" style={{ 
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '50%',
                padding: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={28} color="var(--accent-emerald)" />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Secure Scanning Active
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  No submission runtime or timestamp anomalies detected.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '280px', paddingRight: '0.25rem' }}>
              {plagiarismFlags.map((flag) => {
                const isPending = flag.status === 'Pending';
                
                return (
                  <div 
                    key={flag.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'rgba(0,0,0,0.15)',
                      border: isPending ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--card-border)',
                      borderRadius: '8px',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      boxShadow: isPending ? '0 0 10px rgba(245, 158, 11, 0.03)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Flag Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {flag.participantA} & {flag.participantB}
                        </span>
                        {getStatusBadge(flag.status)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Identical solution code matches on Problem <strong style={{ color: 'var(--accent-cyan)' }}>{flag.problemCode}</strong> (Same timestamp & runtime)
                      </span>
                    </div>

                    {/* Action buttons */}
                    {isPending && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => resolvePlagiarismFlag(flag.id, 'Investigated')}
                          className="btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.7rem',
                            padding: '0.3rem 0.65rem',
                            background: 'var(--accent-red)',
                            color: '#080a0f',
                            border: 'none',
                            fontWeight: 700
                          }}
                        >
                          <Eye size={12} />
                          Disqualify
                        </button>
                        <button
                          onClick={() => resolvePlagiarismFlag(flag.id, 'Cleared')}
                          className="btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.7rem',
                            padding: '0.3rem 0.65rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: 'var(--accent-emerald)',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <Check size={12} />
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </BorderGlow>
  );
}

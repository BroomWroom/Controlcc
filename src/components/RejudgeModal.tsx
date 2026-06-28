'use client';

import React, { useState } from 'react';
import { useContestStore } from '../store/useContestStore';
import { Submission } from '../utils/mockData';
import { X, ShieldAlert } from 'lucide-react';

interface RejudgeModalProps {
  submission: Submission;
  onClose: () => void;
}

export default function RejudgeModal({ submission, onClose }: RejudgeModalProps) {
  const { rejudgeSubmission } = useContestStore();
  const [newVerdict, setNewVerdict] = useState<Submission['verdict']>(submission.verdict);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rejudgeSubmission(submission.id, newVerdict);
    onClose();
  };

  const verdicts: Submission['verdict'][] = [
    'Accepted',
    'Wrong Answer',
    'Time Limit Exceeded',
    'Runtime Error'
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div 
        className="card" 
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-lg)',
          animation: 'modal-scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)' }}>
            <ShieldAlert size={18} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              Rejudge Submission
            </h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              display: 'flex',
              padding: '0.25rem'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Info Box */}
        <div style={{ 
          background: 'rgba(0,0,0,0.15)', 
          border: '1px solid var(--card-border)',
          borderRadius: '6px',
          padding: '0.75rem',
          fontSize: '0.8rem',
          marginBottom: '1.25rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem 1rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Submission ID:</span>
            <div className="mono-font" style={{ fontWeight: 600 }}>#{submission.id}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Participant:</span>
            <div style={{ fontWeight: 600 }}>{submission.participantName}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Problem:</span>
            <div style={{ fontWeight: 600 }}>{submission.problemCode} - {submission.problemName}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Original Verdict:</span>
            <div style={{ fontWeight: 600, color: submission.verdict === 'Accepted' ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
              {submission.verdict}
            </div>
          </div>
        </div>

        {/* Selection Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              SELECT NEW VERDICT:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {verdicts.map((v) => (
                <label 
                  key={v}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: newVerdict === v ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                    border: `1px solid ${newVerdict === v ? 'var(--accent-purple)' : 'var(--card-border)'}`,
                    borderRadius: '6px',
                    padding: '0.6rem 0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: newVerdict === v ? 600 : 500,
                    transition: 'all 0.15s'
                  }}
                >
                  <input 
                    type="radio" 
                    name="verdict" 
                    value={v} 
                    checked={newVerdict === v}
                    onChange={() => setNewVerdict(v)}
                    style={{ accentColor: 'var(--accent-purple)' }}
                  />
                  <span style={{ 
                    color: v === 'Accepted' 
                      ? 'var(--accent-emerald)' 
                      : 'var(--accent-red)' 
                  }}>
                    {v}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn" 
              onClick={onClose}
              style={{ fontSize: '0.8rem' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ 
                fontSize: '0.8rem',
                background: 'var(--accent-purple)',
                color: '#fff',
                boxShadow: 'none'
              }}
            >
              Confirm Rejudge
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        @keyframes modal-scale-up {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useContestStore } from '../store/useContestStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, KeyRound, CheckCircle2, X } from 'lucide-react';

export default function AdminAuthModal() {
  const {
    adminAuthModalOpen,
    setAdminAuthModalOpen,
    setAdminAuthenticated,
    pendingAdminAction,
    setPendingAdminAction
  } = useContestStore();

  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (adminAuthModalOpen) {
      setPasscode('');
      setError(false);
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [adminAuthModalOpen]);

  if (!adminAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    if (passcode === 'vitadmin123') {
      setIsSuccess(true);
      setTimeout(() => {
        setAdminAuthenticated(true);
        if (pendingAdminAction) {
          pendingAdminAction();
        }
        setPendingAdminAction(null);
        setAdminAuthModalOpen(false);
        setPasscode('');
        setIsSuccess(false);
      }, 800);
    } else {
      setError(true);
      setPasscode('');
      // Refocus input for correction
      inputRef.current?.focus();
    }
  };

  const handleClose = () => {
    setPendingAdminAction(null);
    setAdminAuthModalOpen(false);
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 10, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}>
        {/* Overlay closer */}
        <div style={{ position: 'absolute', inset: 0 }} onClick={handleClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            zIndex: 10000
          }}
        >
          {/* Edge glow indicator */}
          <div style={{
            height: '4px',
            width: '100%',
            background: isSuccess 
              ? 'linear-gradient(90deg, var(--accent-emerald), #34d399)'
              : error 
                ? 'linear-gradient(90deg, var(--accent-red), #f87171)'
                : 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))',
            transition: 'background 0.3s ease'
          }} />

          {/* Close button */}
          <button 
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={16} />
          </button>

          {/* Card Content Body */}
          <div style={{ padding: '2rem 1.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.75rem' }}>
              <motion.div
                animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: isSuccess 
                    ? 'rgba(16, 185, 129, 0.1)'
                    : error 
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(139, 92, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  border: `1px solid ${
                    isSuccess 
                      ? 'rgba(16, 185, 129, 0.3)' 
                      : error 
                        ? 'rgba(239, 68, 68, 0.3)' 
                        : 'rgba(139, 92, 246, 0.3)'
                  }`
                }}
              >
                {isSuccess ? (
                  <CheckCircle2 size={24} color="var(--accent-emerald)" />
                ) : error ? (
                  <ShieldAlert size={24} color="var(--accent-red)" />
                ) : (
                  <KeyRound size={24} color="var(--accent-purple)" />
                )}
              </motion.div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                {isSuccess ? 'Clearance Granted' : 'Administrative Access Required'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {isSuccess 
                  ? 'Access code verified. Authenticated successfully.' 
                  : 'Please enter the security passcode to proceed with this action.'}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  ref={inputRef}
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••••"
                  className="mono-font"
                  disabled={isSuccess}
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '8px',
                    border: `1px solid ${error ? 'var(--accent-red)' : 'var(--card-border)'}`,
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    letterSpacing: '0.25em',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
                />
                
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--accent-red)',
                      textAlign: 'center',
                      margin: '0.5rem 0 0 0',
                      fontWeight: 600
                    }}
                  >
                    Invalid administrative passcode.
                  </motion.p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn"
                  disabled={isSuccess}
                  style={{
                    flex: 1,
                    height: '38px',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    borderRadius: '8px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={isSuccess || !passcode}
                  style={{
                    flex: 1,
                    height: '38px',
                    justifyContent: 'center',
                    background: isSuccess 
                      ? 'var(--accent-emerald)' 
                      : error 
                        ? 'var(--accent-red)' 
                        : 'var(--accent-purple)',
                    color: '#ffffff',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: isSuccess 
                      ? '0 0 15px rgba(16, 185, 129, 0.3)' 
                      : 'none'
                  }}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

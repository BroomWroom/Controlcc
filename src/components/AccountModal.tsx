'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useContestStore } from '../store/useContestStore';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, User, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AccountModal() {
  const {
    registeredUser,
    currentUser,
    registerAccount,
    loginAccount
  } = useContestStore();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);

  // Switch to registration mode automatically if no user is registered
  useEffect(() => {
    if (!registeredUser) {
      setIsRegister(true);
    } else {
      setIsRegister(false);
      // Prefill username for login
      setUsername(registeredUser.username);
    }
  }, [registeredUser]);

  // If already logged in, do not render anything
  if (currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setIsSuccess(true);
      setTimeout(() => {
        registerAccount(username.trim(), password);
        setIsSuccess(false);
      }, 800);
    } else {
      const success = loginAccount(username.trim(), password);
      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
        }, 800);
      } else {
        setError('Incorrect password. Access denied.');
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(8, 10, 15, 0.95)',
      backdropFilter: 'blur(16px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          background: '#10141e',
          border: '1px solid #1e2637',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden'
        }}
      >
        {/* Glow Line Indicator */}
        <div style={{
          height: '4px',
          width: '100%',
          background: isSuccess 
            ? 'linear-gradient(90deg, var(--accent-emerald), #34d399)'
            : error 
              ? 'linear-gradient(90deg, var(--accent-red), #f87171)'
              : 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))'
        }} />

        <div style={{ padding: '2.25rem 2rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
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

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isRegister ? 'Register Admin Account' : 'Control Deck Login'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              {isRegister 
                ? 'Create administrative credentials to initialize and secure this operations center.' 
                : 'Enter your credentials to unlock access to the live contest control systems.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Username Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. CCAdmin"
                  disabled={isSuccess}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid #1e2637',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'var(--text-primary)',
                    paddingLeft: '2.25rem',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: isSuccess ? 'not-allowed' : 'text'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSuccess}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid #1e2637',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'var(--text-primary)',
                    paddingLeft: '2.25rem',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Confirm Password Field (Register Only) */}
            {isRegister && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSuccess}
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #1e2637',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'var(--text-primary)',
                      paddingLeft: '2.25rem',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-red)',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                {error}
              </motion.p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn"
              disabled={isSuccess}
              style={{
                width: '100%',
                height: '40px',
                justifyContent: 'center',
                background: isSuccess 
                  ? 'var(--accent-emerald)' 
                  : 'var(--accent-purple)',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                marginTop: '0.5rem',
                boxShadow: isSuccess 
                  ? '0 0 15px rgba(16, 185, 129, 0.3)' 
                  : 'none'
              }}
            >
              {isSuccess 
                ? 'Processing...' 
                : isRegister 
                  ? 'Initialize Center' 
                  : 'Unlock Deck'}
            </button>

            {/* Toggle Link if a user is already registered */}
            {registeredUser && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <span 
                  onClick={() => {
                    if (isSuccess) return;
                    setIsRegister(!isRegister);
                    setError('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-cyan)',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {isRegister ? 'Or log in with existing account' : 'Register another user'}
                </span>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

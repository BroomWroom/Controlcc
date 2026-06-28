'use client';

import React from 'react';
import { useContestStore } from '../store/useContestStore';
import { Users, FileText, CheckCircle2, XCircle, BarChart3, AlertCircle } from 'lucide-react';
import BorderGlow from './BorderGlow';

export default function OverviewStats() {
  const { participants, submissions, problems, contestStatus, rewindMinute } = useContestStore();

  // 1. Filter submissions based on rewindMinute if active
  const displaySubmissions = rewindMinute !== null 
    ? submissions.filter((s) => s.timestamp <= rewindMinute)
    : submissions;

  const totalParticipantsCount = participants.length;
  const activeParticipantsCount = participants.filter((p) => p.status === 'Active').length;
  
  const totalSubmissionsCount = displaySubmissions.length;
  const acceptedCount = displaySubmissions.filter((s) => s.verdict === 'Accepted').length;
  const pendingCount = displaySubmissions.filter((s) => ['Pending', 'Running'].includes(s.verdict)).length;
  const rejectedCount = totalSubmissionsCount - acceptedCount - pendingCount;

  // Ratios
  const successRate = totalSubmissionsCount > 0 
    ? Math.round((acceptedCount / (totalSubmissionsCount - pendingCount || 1)) * 100) 
    : 0;

  // Let's create stat cards data structure
  const stats = [
    {
      title: 'Participants',
      value: totalParticipantsCount,
      subtext: `${activeParticipantsCount} active in session`,
      icon: <Users size={20} color="var(--accent-blue)" />,
      borderColor: 'rgba(59, 130, 246, 0.25)'
    },
    {
      title: 'Total Problems',
      value: problems.length,
      subtext: `${problems.filter(p => p.difficulty === 'Hard').length} hard level problems`,
      icon: <FileText size={20} color="var(--accent-purple)" />,
      borderColor: 'rgba(139, 92, 246, 0.25)'
    },
    {
      title: 'Submissions',
      value: totalSubmissionsCount,
      subtext: `${pendingCount} running evaluation`,
      icon: <BarChart3 size={20} color="var(--accent-cyan)" />,
      borderColor: 'rgba(6, 182, 212, 0.25)'
    },
    {
      title: 'Accepted Solutions',
      value: acceptedCount,
      subtext: `${successRate}% pass rate`,
      icon: <CheckCircle2 size={20} color="var(--accent-emerald)" />,
      borderColor: 'rgba(16, 185, 129, 0.25)'
    },
    {
      title: 'Rejected Solutions',
      value: rejectedCount,
      subtext: `${displaySubmissions.filter(s => s.verdict === 'Wrong Answer').length} WRONG ANSWER`,
      icon: <XCircle size={20} color="var(--accent-red)" />,
      borderColor: 'rgba(239, 68, 68, 0.25)'
    },
    {
      title: 'Contest Status',
      value: contestStatus.toUpperCase(),
      subtext: contestStatus === 'Live' ? 'Running Sim Engine' : 'Idle Standby Mode',
      icon: <AlertCircle size={20} color={contestStatus === 'Live' ? 'var(--accent-emerald)' : 'var(--text-muted)'} />,
      borderColor: contestStatus === 'Live' ? 'rgba(16, 185, 129, 0.25)' : 'var(--card-border)'
    }
  ];

  return (
    <div className="col-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', width: '100%' }}>
      {stats.map((stat, idx) => (
        <BorderGlow 
          key={idx}
          colors={[
            stat.borderColor.replace('0.25', '1'), 
            stat.borderColor.replace('0.25', '0.6'), 
            'rgba(59, 130, 246, 0.3)'
          ]}
          style={{
            borderLeft: `3px solid ${stat.borderColor.replace('0.25', '1')}`
          }}
        >
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            padding: '1.25rem',
            height: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.title}
              </span>
              {stat.icon}
            </div>
            <div>
              <div className="mono-font" style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, marginBottom: '0.25rem' }}>
                {stat.value}
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {stat.subtext}
              </span>
            </div>
          </div>
        </BorderGlow>
      ))}
    </div>
  );
}

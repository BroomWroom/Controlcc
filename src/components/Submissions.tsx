'use client';

import React, { useState } from 'react';
import { useContestStore } from '../store/useContestStore';
import { Submission } from '../utils/mockData';
import { ListFilter, Search, RefreshCw, Undo, RotateCw } from 'lucide-react';
import RejudgeModal from './RejudgeModal';
import BorderGlow from './BorderGlow';

export default function Submissions() {
  const { 
    submissions, 
    rejudgeHistory, 
    undoLastRejudge,
    problems,
    rewindMinute
  } = useContestStore();

  // Local UI Filter States
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');
  const [problemFilter, setProblemFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rejudgeTarget, setRejudgeTarget] = useState<Submission | null>(null);

  const ITEMS_PER_PAGE = 8;

  // 1. Filter submissions based on rewindMinute if active
  const displaySubmissions = rewindMinute !== null 
    ? submissions.filter((s) => s.timestamp <= rewindMinute)
    : submissions;

  // Filter Logic
  const filteredSubmissions = displaySubmissions.filter((sub) => {
    const matchesVerdict = verdictFilter === 'ALL' || sub.verdict === verdictFilter;
    const matchesProblem = problemFilter === 'ALL' || sub.problemCode === problemFilter;
    const matchesSearch = 
      sub.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.problemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesVerdict && matchesProblem && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE) || 1;
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Verdict Badge Maker
  const renderVerdictBadge = (verdict: Submission['verdict']) => {
    switch (verdict) {
      case 'Accepted':
        return <span className="badge badge-ac">Accepted</span>;
      case 'Wrong Answer':
        return <span className="badge badge-wa">Wrong Answer</span>;
      case 'Time Limit Exceeded':
        return <span className="badge badge-wa" style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)' }}>TLE</span>;
      case 'Runtime Error':
        return <span className="badge badge-wa" style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)' }}>RTE</span>;
      case 'Pending':
        return (
          <span className="badge badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RotateCw size={10} className="blink-animation" style={{ animation: 'spin 1.5s linear infinite' }} />
            Pending
          </span>
        );
      case 'Running':
        return (
          <span className="badge badge-pending" style={{ color: 'var(--accent-blue)', borderColor: 'rgba(59, 130, 246, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RotateCw size={10} style={{ animation: 'spin 1s linear infinite' }} />
            Running
          </span>
        );
      default:
        return <span className="badge">{verdict}</span>;
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <BorderGlow className="col-12">
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '1.25rem', width: '100%' }}>
      
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={18} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            Live Submission Stream
          </h2>
          <span className="mono-font" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            ({filteredSubmissions.length} matches)
          </span>
        </div>

        {/* Undo Rejudge Button */}
        {rejudgeHistory.length > 0 && (
          <button 
            className="btn btn-primary" 
            onClick={undoLastRejudge}
            style={{ 
              fontSize: '0.7rem', 
              padding: '0.25rem 0.5rem', 
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: 'var(--accent-purple)'
            }}
          >
            <Undo size={12} /> Undo Rejudge ({rejudgeHistory.length})
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        marginBottom: '1rem', 
        flexWrap: 'wrap',
        background: 'rgba(0,0,0,0.1)',
        padding: '0.5rem',
        borderRadius: '8px',
        border: '1px solid var(--card-border)'
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '8px' }} />
          <input 
            type="text" 
            placeholder="Search team or problem..."
            className="input-field" 
            style={{ paddingLeft: '1.75rem', height: '32px' }}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Verdict Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ListFilter size={12} color="var(--text-muted)" />
          <select 
            className="input-field"
            style={{ width: '120px', height: '32px', padding: '0 0.5rem' }}
            value={verdictFilter}
            onChange={(e) => {
              setVerdictFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Verdicts</option>
            <option value="Accepted">Accepted</option>
            <option value="Wrong Answer">Wrong Answer</option>
            <option value="Time Limit Exceeded">TLE</option>
            <option value="Runtime Error">RTE</option>
            <option value="Pending">Pending</option>
            <option value="Running">Running</option>
          </select>
        </div>

        {/* Problem Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ListFilter size={12} color="var(--text-muted)" />
          <select 
            className="input-field"
            style={{ width: '120px', height: '32px', padding: '0 0.5rem' }}
            value={problemFilter}
            onChange={(e) => {
              setProblemFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Problems</option>
            {problems.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} - {p.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="data-table-container" style={{ flex: 1 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Sub ID</th>
              <th>Participant</th>
              <th>Problem</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Time</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Verdict</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Language</th>
              <th style={{ width: '80px', textAlign: 'right' }}>Exec Time</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Admin</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSubmissions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No submissions match the current filters.
                </td>
              </tr>
            ) : (
              paginatedSubmissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="mono-font" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    #{sub.id.substring(4, 9) || sub.id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{sub.participantName}</td>
                  <td>
                    <span className="mono-font" style={{ color: 'var(--accent-cyan)', fontWeight: 600, marginRight: '0.35rem' }}>
                      {sub.problemCode}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {sub.problemName}
                    </span>
                  </td>
                  <td className="mono-font" style={{ textAlign: 'center' }}>
                    {sub.timestamp}m
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {renderVerdictBadge(sub.verdict)}
                  </td>
                  <td className="mono-font" style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {sub.language}
                  </td>
                  <td className="mono-font" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                    {sub.verdict === 'Pending' || sub.verdict === 'Running' ? '-' : `${sub.executionTime}s`}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn" 
                      onClick={() => setRejudgeTarget(sub)}
                      style={{ 
                        padding: '0.25rem 0.5rem', 
                        fontSize: '0.7rem', 
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        color: 'var(--accent-purple)'
                      }}
                      title="Rejudge Submission"
                      disabled={['Pending', 'Running'].includes(sub.verdict)}
                    >
                      Rejudge
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '1rem',
          borderTop: '1px solid var(--card-border)',
          paddingTop: '0.75rem',
          fontSize: '0.8rem'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Showing page <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
          </span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button 
              className="btn" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            >
              Previous
            </button>
            <button 
              className="btn" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* CSS Spin Keyframe */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Rejudge Modal Dialog */}
      {rejudgeTarget && (
        <RejudgeModal 
          submission={rejudgeTarget} 
          onClose={() => setRejudgeTarget(null)} 
        />
      )}
      </div>
    </BorderGlow>
  );
}

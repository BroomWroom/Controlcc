'use client';

import React, { useState } from 'react';
import { useContestStore, calculateStandings } from '../store/useContestStore';
import { Users, Search, ArrowUpDown } from 'lucide-react';
import BorderGlow from './BorderGlow';

export default function ParticipantTable() {
  const { 
    participants, 
    problems, 
    submissions, 
    timeRemaining, 
    sandboxSimulation, 
    rewindMinute 
  } = useContestStore();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('ALL');
  const [maxRank, setMaxRank] = useState<number>(100);
  const [minSolved, setMinSolved] = useState<number>(0);
  
  // Sorting & Pagination States
  const [sortField, setSortField] = useState<'rank' | 'name' | 'solvedCount' | 'penaltyTime'>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  // Compute displays list reactively to rewind and sandbox simulations
  const displaySubmissions = rewindMinute !== null 
    ? submissions.filter((s) => s.timestamp <= rewindMinute)
    : submissions;

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

  const displayList = calculateStandings(participants, simulationSubmissions, problems);

  // Extract unique institutions for dropdown filter
  const institutions = Array.from(new Set(displayList.map((p) => p.institution))).sort();

  // Handle Sort Toggle
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filter Logic (combined)
  const filteredParticipants = displayList.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.institution.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesInstitution = selectedInstitution === 'ALL' || p.institution === selectedInstitution;
    const matchesRank = p.status === 'Disqualified' ? true : p.rank <= maxRank;
    const matchesSolved = p.solvedCount >= minSolved;

    return matchesSearch && matchesInstitution && matchesRank && matchesSolved;
  });

  // Sort Logic
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    let comparison = 0;
    // Disqualified go to the bottom in default rank sort
    if (sortField === 'rank') {
      if (a.status === 'Disqualified' && b.status !== 'Disqualified') return 1;
      if (b.status === 'Disqualified' && a.status !== 'Disqualified') return -1;
      if (a.status === 'Disqualified' && b.status === 'Disqualified') return a.name.localeCompare(b.name);
      comparison = a.rank - b.rank;
    } else if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else {
      comparison = a[sortField] - b[sortField];
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedParticipants.length / ITEMS_PER_PAGE) || 1;
  const paginatedParticipants = sortedParticipants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <BorderGlow className="col-12">
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '1.25rem', width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Users size={18} color="var(--accent-blue)" />
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
          Participant Registry & Filter Management
        </h2>
        <span className="mono-font" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          ({filteredParticipants.length} filtered)
        </span>
      </div>

      {/* Advanced Filter Toolbar */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem',
        background: 'rgba(0,0,0,0.1)',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid var(--card-border)'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>SEARCH PARTICIPANT</span>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '8px' }} />
            <input 
              type="text" 
              placeholder="Search name/university..."
              className="input-field" 
              style={{ paddingLeft: '1.75rem', height: '32px' }}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Institution Select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>UNIVERSITY / INSTITUTION</span>
          <select 
            className="input-field"
            style={{ height: '32px', padding: '0 0.5rem' }}
            value={selectedInstitution}
            onChange={(e) => {
              setSelectedInstitution(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Universities</option>
            {institutions.map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>

        {/* Max Rank Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>MAXIMUM RANK</span>
            <span className="mono-font" style={{ color: 'var(--accent-blue)' }}>&lt;= {maxRank}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={maxRank}
            onChange={(e) => {
              setMaxRank(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ 
              height: '32px', 
              accentColor: 'var(--accent-blue)',
              background: 'transparent'
            }}
          />
        </div>

        {/* Min Solved Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>MIN SOLVED PROBLEMS</span>
            <span className="mono-font" style={{ color: 'var(--accent-emerald)' }}>&gt;= {minSolved}</span>
          </div>
          <select 
            className="input-field"
            style={{ height: '32px', padding: '0 0.5rem' }}
            value={minSolved}
            onChange={(e) => {
              setMinSolved(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={0}>0+ Problems Solved</option>
            <option value={1}>1+ Problems Solved</option>
            <option value={2}>2+ Problems Solved</option>
            <option value={3}>3+ Problems Solved</option>
            <option value={4}>4+ Problems Solved</option>
            <option value={5}>5+ Problems Solved</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="data-table-container" style={{ flex: 1 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('rank')} style={{ cursor: 'pointer', width: '90px' }} title="Sort by Rank">
                Rank <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }} title="Sort by Name">
                Name <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th>Institution</th>
              <th onClick={() => handleSort('solvedCount')} style={{ cursor: 'pointer', width: '120px', textAlign: 'center' }} title="Sort by Solved">
                Solved <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th onClick={() => handleSort('penaltyTime')} style={{ cursor: 'pointer', width: '120px', textAlign: 'right' }} title="Sort by Penalty">
                Penalty <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
              </th>
              <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedParticipants.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No participants match the selected filter criteria.
                </td>
              </tr>
            ) : (
              paginatedParticipants.map((p) => {
                const isDq = p.status === 'Disqualified';
                const rowBg = isDq ? 'rgba(239, 68, 68, 0.04)' : 'transparent';
                
                return (
                  <tr key={p.name} style={{ background: rowBg, transition: 'all 0.3s ease' }}>
                    <td className="mono-font" style={{ fontWeight: 600, color: isDq ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                      {isDq ? 'DQ' : `#${p.rank}`}
                    </td>
                    <td style={{ fontWeight: 600, color: isDq ? 'var(--accent-red)' : 'var(--text-primary)', textDecoration: isDq ? 'line-through' : 'none' }}>
                      {p.name}
                    </td>
                    <td style={{ color: isDq ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                      {p.institution}
                    </td>
                    <td className="mono-font" style={{ textAlign: 'center', fontWeight: 700, color: isDq ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {p.solvedCount}
                    </td>
                    <td className="mono-font" style={{ textAlign: 'right', color: isDq ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                      {p.penaltyTime} mins
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span 
                        className="badge" 
                        style={{ 
                          background: p.status === 'Active' 
                            ? 'rgba(16, 185, 129, 0.08)' 
                            : p.status === 'Inactive' 
                              ? 'rgba(148, 163, 184, 0.08)' 
                              : 'rgba(239, 68, 68, 0.08)',
                          color: p.status === 'Active' 
                            ? 'var(--accent-emerald)' 
                            : p.status === 'Inactive' 
                              ? 'var(--text-secondary)' 
                              : 'var(--accent-red)',
                          border: `1px solid ${p.status === 'Active' 
                            ? 'rgba(16, 185, 129, 0.2)' 
                            : p.status === 'Inactive' 
                              ? 'rgba(148, 163, 184, 0.2)' 
                              : 'rgba(239, 68, 68, 0.2)'}`,
                        }}
                      >
                        {isDq ? 'Suspended' : p.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
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
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            >
              Previous
            </button>
            <button 
              className="btn" 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </BorderGlow>
  );
}

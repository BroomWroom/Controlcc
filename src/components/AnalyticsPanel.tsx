'use client';

import React from 'react';
import { useContestStore } from '../store/useContestStore';
import { Submission } from '../utils/mockData';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart,
  Line,
  Legend
} from 'recharts';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, Terminal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BorderGlow from './BorderGlow';

export default function AnalyticsPanel() {
  const { submissions, problems, rewindMinute } = useContestStore();

  // 1. Filter submissions based on rewindMinute if active
  const displaySubmissions = rewindMinute !== null 
    ? submissions.filter((s) => s.timestamp <= rewindMinute)
    : submissions;

  // 1. Verdict distribution data
  const verdicts = ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error'];
  const colors = {
    'Accepted': 'var(--accent-emerald)',
    'Wrong Answer': 'var(--accent-red)',
    'Time Limit Exceeded': 'var(--accent-amber)',
    'Runtime Error': 'var(--accent-purple)'
  };
  
  const verdictCounts = verdicts.map(v => ({
    name: v === 'Time Limit Exceeded' ? 'TLE' : v === 'Runtime Error' ? 'RTE' : v,
    value: displaySubmissions.filter(s => s.verdict === v).length,
    color: colors[v as keyof typeof colors] || 'var(--text-muted)'
  })).filter(item => item.value > 0);

  // 2. Problem success rates data
  const problemStats = problems.map(prob => {
    const total = displaySubmissions.filter(s => s.problemCode === prob.code && !['Pending', 'Running'].includes(s.verdict)).length;
    const solved = displaySubmissions.filter(s => s.problemCode === prob.code && s.verdict === 'Accepted').length;
    return {
      name: prob.code,
      Solved: solved,
      Total: total,
      Failed: total - solved
    };
  });

  // 3. Submissions timeline (grouped by 10 minute intervals)
  const timelineBuckets: { [bucket: number]: { count: number; accepted: number } } = {};
  for (let i = 0; i <= 18; i++) {
    timelineBuckets[i * 10] = { count: 0, accepted: 0 };
  }

  displaySubmissions.forEach(sub => {
    const bucket = Math.floor(sub.timestamp / 10) * 10;
    if (timelineBuckets[bucket] !== undefined) {
      timelineBuckets[bucket].count += 1;
      if (sub.verdict === 'Accepted') {
        timelineBuckets[bucket].accepted += 1;
      }
    }
  });

  const timelineData = Object.keys(timelineBuckets)
    .map(key => Number(key))
    .sort((a, b) => a - b)
    .map(bucket => ({
      time: `${bucket}m`,
      Submissions: timelineBuckets[bucket].count,
      Accepted: timelineBuckets[bucket].accepted
    }));

  // 4. Language popularity breakdown combat data
  const languages: Submission['language'][] = ['C++', 'Python', 'Java', 'Go'];
  const langColors = {
    'C++': 'var(--accent-blue)',
    'Python': 'var(--accent-amber)',
    'Java': 'var(--accent-red)',
    'Go': 'var(--accent-purple)'
  };
  
  const languageData = languages.map(lang => ({
    name: lang,
    value: displaySubmissions.filter(s => s.language === lang).length,
    color: langColors[lang] || 'var(--text-muted)'
  })).sort((a, b) => b.value - a.value); // Sort descending to trigger live reordering animations!

  const [analysisDetails, setAnalysisDetails] = React.useState<{
    category: string;
    name: string;
    stats: { label: string; value: string | number }[];
    recentList: Submission[];
  } | null>(null);

  const handleLanguageClick = (lang: string) => {
    const langSubs = displaySubmissions.filter(s => s.language === lang);
    const total = langSubs.length;
    const ac = langSubs.filter(s => s.verdict === 'Accepted').length;
    const rate = total > 0 ? ((ac / total) * 100).toFixed(1) : '0';
    const acRuntimes = langSubs.filter(s => s.verdict === 'Accepted').map(s => s.executionTime);
    const avgRuntime = acRuntimes.length > 0 
      ? (acRuntimes.reduce((a, b) => a + b, 0) / acRuntimes.length).toFixed(3) 
      : '0';

    setAnalysisDetails({
      category: 'Programming Language',
      name: lang,
      stats: [
        { label: 'Total Submissions', value: total },
        { label: 'Solve Success Rate', value: `${rate}%` },
        { label: 'Average Accepted Speed', value: `${avgRuntime}s` },
        { label: 'Total Solves', value: `${ac} AC` }
      ],
      recentList: langSubs.slice(0, 5)
    });
  };

  const handleVerdictClick = (data: any) => {
    if (!data || !data.name) return;
    
    let fullVerdict = data.name;
    if (fullVerdict === 'TLE') fullVerdict = 'Time Limit Exceeded';
    if (fullVerdict === 'RTE') fullVerdict = 'Runtime Error';

    const matchSubs = displaySubmissions.filter(s => s.verdict === fullVerdict);
    const total = matchSubs.length;
    const pct = displaySubmissions.length > 0 
      ? ((total / displaySubmissions.length) * 100).toFixed(1) 
      : '0';

    const probCounts: { [code: string]: number } = {};
    matchSubs.forEach(s => {
      probCounts[s.problemCode] = (probCounts[s.problemCode] || 0) + 1;
    });
    const topProb = Object.keys(probCounts).reduce((a, b) => probCounts[a] > probCounts[b] ? a : b, 'None');
    const topCount = probCounts[topProb] || 0;

    setAnalysisDetails({
      category: 'Submission Verdict',
      name: fullVerdict,
      stats: [
        { label: 'Total Occurrences', value: total },
        { label: 'Percentage of Total', value: `${pct}%` },
        { label: 'Highest Frequency', value: topCount > 0 ? `Problem ${topProb} (${topCount} times)` : 'None' },
        { label: 'Contest Impact', value: fullVerdict === 'Accepted' ? 'Positive (Adds points)' : 'Negative (Adds 20m penalty)' }
      ],
      recentList: matchSubs.slice(0, 5)
    });
  };

  const handleProblemClick = (code: string) => {
    const probSubs = displaySubmissions.filter(s => s.problemCode === code && !['Pending', 'Running'].includes(s.verdict));
    const total = probSubs.length;
    const solved = displaySubmissions.filter(s => s.problemCode === code && s.verdict === 'Accepted').length;
    const rate = total > 0 ? ((solved / total) * 100).toFixed(1) : '0';
    
    const acSubs = displaySubmissions.filter(s => s.problemCode === code && s.verdict === 'Accepted');
    const firstSolve = acSubs.length > 0 
      ? acSubs.reduce((min, s) => s.timestamp < min.timestamp ? s : min, acSubs[0]) 
      : null;

    const langCounts: { [lang: string]: number } = {};
    probSubs.forEach(s => {
      langCounts[s.language] = (langCounts[s.language] || 0) + 1;
    });
    const topLang = Object.keys(langCounts).reduce((a, b) => langCounts[a] > langCounts[b] ? a : b, 'None');

    setAnalysisDetails({
      category: 'Contest Problem',
      name: `Problem ${code}`,
      stats: [
        { label: 'Total Submissions', value: total },
        { label: 'Solve Success Rate', value: `${rate}%` },
        { label: 'First Blood Solve', value: firstSolve ? `${firstSolve.participantName} (${firstSolve.timestamp}m)` : 'Unsolved' },
        { label: 'Preferred Language', value: topLang !== 'None' ? `${topLang} (${langCounts[topLang]} times)` : 'None' }
      ],
      recentList: displaySubmissions.filter(s => s.problemCode === code).slice(0, 5)
    });
  };

  const handleTimelineClick = (timeStr: string) => {
    const minVal = parseInt(timeStr);
    if (isNaN(minVal)) return;

    const timeSubs = displaySubmissions.filter(s => s.timestamp >= minVal && s.timestamp < minVal + 10);
    const total = timeSubs.length;
    const ac = timeSubs.filter(s => s.verdict === 'Accepted').length;
    const uniqueParticipants = new Set(timeSubs.map(s => s.participantName)).size;

    setAnalysisDetails({
      category: 'Timeline Window',
      name: `Minute ${minVal} - ${minVal + 9}`,
      stats: [
        { label: 'Submissions Submitted', value: total },
        { label: 'Successful Solves (AC)', value: ac },
        { label: 'Failed Submissions', value: total - ac },
        { label: 'Active Teams in Window', value: uniqueParticipants }
      ],
      recentList: timeSubs.slice(0, 5)
    });
  };

  return (
    <div className="col-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', width: '100%', marginTop: '0.5rem' }}>
      
      {/* Chart 1: Verdict Distribution (Pie) */}
      <BorderGlow colors={['var(--accent-emerald)', 'var(--accent-cyan)', 'rgba(59, 130, 246, 0.3)']}>
        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', padding: '1.25rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <PieIcon size={16} color="var(--accent-emerald)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Submission Verdict Distribution
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {verdictCounts.length === 0 ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No submissions evaluated yet</span>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verdictCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => handleVerdictClick(data)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {verdictCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  wrapperStyle={{ zIndex: 1000 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg, #10141e)', 
                    border: '1px solid var(--card-border, #1e2637)', 
                    color: 'var(--text-primary, #f8fafc)', 
                    borderRadius: '6px' 
                  }}
                />
                <Legend 
                  layout="horizontal" 
                  align="center" 
                  verticalAlign="bottom" 
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        </div>
      </BorderGlow>

      {/* Chart 2: Problem Submission stats (Stacked Bar) */}
      <BorderGlow colors={['var(--accent-blue)', 'var(--accent-red)', 'rgba(59, 130, 246, 0.3)']}>
        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', padding: '1.25rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BarChart3 size={16} color="var(--accent-blue)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Submissions & Solves Per Problem
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={problemStats}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              onClick={(state) => {
                if (state && state.activeLabel) {
                  handleProblemClick(String(state.activeLabel));
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
              <Tooltip 
                wrapperStyle={{ zIndex: 1000 }}
                contentStyle={{ 
                  backgroundColor: 'var(--card-bg, #10141e)', 
                  border: '1px solid var(--card-border, #1e2637)', 
                  color: 'var(--text-primary, #f8fafc)', 
                  borderRadius: '6px' 
                }}
                cursor={false}
              />
              <Legend 
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{value}</span>}
              />
              <Bar dataKey="Solved" stackId="a" fill="var(--accent-emerald)" radius={[0, 0, 0, 0]} activeBar={false} />
              <Bar dataKey="Failed" stackId="a" fill="var(--accent-red)" radius={[4, 4, 0, 0]} activeBar={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        </div>
      </BorderGlow>

      {/* Chart 3: Live Submissions Timeline (Line) */}
      <BorderGlow colors={['var(--accent-cyan)', 'var(--accent-emerald)', 'rgba(59, 130, 246, 0.3)']}>
        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', padding: '1.25rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <LineIcon size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Contest Submission Activity Timeline
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timelineData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              onClick={(state) => {
                if (state && state.activeLabel) {
                  handleTimelineClick(String(state.activeLabel));
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
              <Tooltip 
                wrapperStyle={{ zIndex: 1000 }}
                contentStyle={{ 
                  backgroundColor: 'var(--card-bg, #10141e)', 
                  border: '1px solid var(--card-border, #1e2637)', 
                  color: 'var(--text-primary, #f8fafc)', 
                  borderRadius: '6px' 
                }}
              />
              <Legend 
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{value}</span>}
              />
              <Line type="monotone" dataKey="Submissions" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Accepted" stroke="var(--accent-emerald)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        </div>
      </BorderGlow>

      {/* Chart 4: Language Breakdown Combat Chart (Sorted Horizontal Bar) */}
      <BorderGlow colors={['var(--accent-purple)', 'var(--accent-blue)', 'rgba(59, 130, 246, 0.3)']}>
        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', padding: '1.25rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Terminal size={16} color="var(--accent-purple)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Language Popularity Combat Race
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={languageData}
              margin={{ top: 10, right: 20, left: -25, bottom: 0 }}
              onClick={(state) => {
                if (state && state.activeLabel) {
                  handleLanguageClick(String(state.activeLabel));
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="var(--text-primary)" fontSize={10} tickLine={false} />
              <Tooltip 
                wrapperStyle={{ zIndex: 1000 }}
                contentStyle={{ 
                  backgroundColor: 'var(--card-bg, #10141e)', 
                  border: '1px solid var(--card-border, #1e2637)', 
                  color: 'var(--text-primary, #f8fafc)', 
                  borderRadius: '6px' 
                }}
                cursor={false}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 4, 4, 0]} 
                animationDuration={600} 
                animationEasing="ease-out"
              >
                {languageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        </div>
      </BorderGlow>

      {/* Detailed Inspection Modal Overlay */}
      <AnimatePresence>
        {analysisDetails && (
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
            <div style={{ position: 'absolute', inset: 0 }} onClick={() => setAnalysisDetails(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '520px',
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
                background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))'
              }} />

              {/* Close button */}
              <button 
                onClick={() => setAnalysisDetails(null)}
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
                <div style={{ marginBottom: '1.5rem' }}>
                  <span className="mono-font" style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {analysisDetails.category} Analysis
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                    {analysisDetails.name}
                  </h3>
                </div>

                {/* KPI Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.75rem'
                }}>
                  {analysisDetails.stats.map((stat, index) => (
                    <div 
                      key={index}
                      style={{
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem'
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '0.25rem' }}>
                        {stat.label}
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Submissions List inside this category */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Recent Submissions
                  </h4>
                  {analysisDetails.recentList.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                      No submissions to show.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {analysisDetails.recentList.map((sub) => (
                        <div 
                          key={sub.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '6px',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className="mono-font" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                              #{sub.id.substring(4, 9) || sub.id}
                            </span>
                            <strong style={{ color: 'var(--text-primary)' }}>{sub.participantName}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <span className="mono-font" style={{ color: 'var(--accent-cyan)' }}>{sub.problemCode}</span>
                            <span className="mono-font" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{sub.language}</span>
                            <span style={{ 
                              color: sub.verdict === 'Accepted' ? 'var(--accent-emerald)' : 'var(--accent-red)',
                              fontWeight: 700,
                              fontSize: '0.7rem'
                            }}>
                              {sub.verdict === 'Accepted' ? 'AC' : sub.verdict === 'Time Limit Exceeded' ? 'TLE' : 'WA'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

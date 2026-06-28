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
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, Terminal } from 'lucide-react';
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

    </div>
  );
}

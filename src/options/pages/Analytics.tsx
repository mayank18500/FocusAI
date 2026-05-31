import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';
import { formatDuration } from '@/utils/timeUtils';
import type { DailyStats } from '@/types/tracking';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6'];

export default function Analytics() {
  const [weeklyData, setWeeklyData] = useState<DailyStats[]>([]);
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    if (!isChromeExtension()) { setLoading(false); return; }
    try {
      const [trackRes, weeklyRes] = await Promise.all([
        sendMessage<any>({ type: 'GET_TRACKING' }),
        sendMessage<any>({ type: 'GET_WEEKLY_REPORT' }),
      ]);
      if (trackRes?.dailyStats) setTodayStats(trackRes.dailyStats);
      if (weeklyRes?.report?.dailyStats) setWeeklyData(weeklyRes.report.dailyStats);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const dailyChart = weeklyData.map((d) => ({
    date: d.date.slice(5),
    focus: Math.round(d.focusTime / 60),
    distraction: Math.round(d.distractionTime / 60),
    neutral: Math.round(d.neutralTime / 60),
  }));

  const scoreChart = weeklyData.map((d) => ({
    date: d.date.slice(5),
    score: d.focusScore,
  }));

  const pieData = todayStats ? [
    { name: 'Focus', value: todayStats.focusTime },
    { name: 'Distraction', value: todayStats.distractionTime },
    { name: 'Neutral', value: todayStats.neutralTime },
  ].filter((d) => d.value > 0) : [];

  const topSites = [
    ...(todayStats?.topProductiveSites || []).map((s) => ({ ...s, type: 'productive' as const })),
    ...(todayStats?.topDistractingSites || []).map((s) => ({ ...s, type: 'distracting' as const })),
  ].sort((a, b) => b.totalTime - a.totalTime).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Deep dive into your productivity patterns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Focus Breakdown */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Daily Focus Breakdown (min)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '8px', color: '#fafafa', fontSize: 12 }} />
              <Area type="monotone" dataKey="focus" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              <Area type="monotone" dataKey="distraction" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
              <Area type="monotone" dataKey="neutral" stackId="1" stroke="#6b7280" fill="#6b7280" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Time Distribution */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Today's Time Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={['#10b981', '#ef4444', '#6b7280'][i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatDuration(value)}
                  contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '8px', color: '#fafafa', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data yet</div>
          )}
          <div className="flex justify-center gap-4 mt-2">
            {['Focus', 'Distraction', 'Neutral'].map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#10b981', '#ef4444', '#6b7280'][i] }} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Focus Score + Top Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Focus Score Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={scoreChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '8px', color: '#fafafa', fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Top Websites Today</h3>
          {topSites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No site data yet</p>
          ) : (
            <div className="space-y-2">
              {topSites.map((site, i) => (
                <div key={site.domain} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${site.type === 'productive' ? 'bg-success' : 'bg-destructive'}`} />
                      <span className="text-xs truncate">{site.domain}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDuration(site.totalTime)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';
import { formatDuration, getRelativeTime } from '@/utils/timeUtils';
import type { DailyStats } from '@/types/tracking';
import type { FocusSession } from '@/types/session';
import type { Pet } from '@/types/pet';
import { PET_STAGE_EMOJI, PET_STAGE_LABELS } from '@/types/pet';
import { getXPForNextStage } from '@/utils/xpCalculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<DailyStats[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    if (!isChromeExtension()) { setLoading(false); return; }
    try {
      const [trackingRes, sessionRes, petRes, weeklyRes] = await Promise.all([
        sendMessage<any>({ type: 'GET_TRACKING' }),
        sendMessage<any>({ type: 'GET_SESSION_HISTORY', payload: { limit: 5 } }),
        sendMessage<any>({ type: 'GET_PET' }),
        sendMessage<any>({ type: 'GET_WEEKLY_REPORT' }),
      ]);
      if (trackingRes?.dailyStats) setStats(trackingRes.dailyStats);
      if (sessionRes?.sessions) setSessions(sessionRes.sessions);
      if (petRes?.pet) setPet(petRes.pet);
      if (weeklyRes?.report?.dailyStats) setWeeklyData(weeklyRes.report.dailyStats);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-4 border-4 border-info/20 rounded-full"></div>
          <div className="absolute inset-4 border-4 border-t-info rounded-full animate-spin-reverse"></div>
        </div>
      </div>
    );
  }

  const chartData = weeklyData.map((d) => ({
    date: d.date.slice(5),
    focus: Math.round(d.focusTime / 60),
    distraction: Math.round(d.distractionTime / 60),
    score: d.focusScore,
  }));

  const petProgress = pet ? getXPForNextStage(pet.xp) : null;
  
  // Format today's date nicely
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 relative">
      {/* Background Soft Aura */}
      <div className="bg-aura" />

      {/* Header section with Date Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Your productivity at a glance
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center px-3.5 py-1.5 rounded-full bg-secondary/40 border border-border/40 backdrop-blur-md shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground">📅 {todayFormatted}</span>
        </div>
      </div>

      {/* Glowing Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon="⏱️" 
          label="Today's Focus" 
          value={formatDuration(stats?.focusTime || 0)} 
          glowColor="hover-glow-card-emerald"
          borderClass="border-emerald-500/20 hover:border-emerald-500/40"
          accentBg="bg-emerald-500/10 text-emerald-400"
          valueClass="text-emerald-400"
        />
        <StatCard 
          icon="📱" 
          label="Distraction" 
          value={formatDuration(stats?.distractionTime || 0)} 
          glowColor="hover-glow-card-destructive"
          borderClass="border-destructive/20 hover:border-destructive/40"
          accentBg="bg-destructive/10 text-destructive/90"
          valueClass="text-destructive/90"
        />
        <StatCard 
          icon="⚡" 
          label="Focus Score" 
          value={`${stats?.focusScore || 0}/100`} 
          glowColor="hover-glow-card"
          borderClass="border-primary/20 hover:border-primary/40"
          accentBg="bg-primary/10 text-primary"
          valueClass="gradient-text"
        />
        <StatCard 
          icon="🔥" 
          label="Streak" 
          value={`${pet?.streak || 0} days`} 
          glowColor="hover-glow-card-amber"
          borderClass="border-amber-500/20 hover:border-amber-500/40"
          accentBg="bg-amber-500/10 text-amber-400"
          valueClass="text-amber-400"
        />
      </div>

      {/* Premium Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Focus Chart */}
        <div className="glass-card p-6 border border-border/50 hover:border-border/80 transition-all shadow-md">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold tracking-wide text-foreground/90 uppercase flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-primary" />
              Weekly Focus (minutes)
            </h3>
            <div className="flex gap-3 text-[10px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary" /> Focus</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-destructive opacity-60" /> Distraction</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <defs>
                <linearGradient id="focusBarGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="distractBarGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 4 }}
                contentStyle={{ background: '#12121a', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px', color: '#fafafa', fontSize: 11, backdropFilter: 'blur(10px)' }}
              />
              <Bar dataKey="focus" fill="url(#focusBarGlow)" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="distraction" fill="url(#distractBarGlow)" radius={[4, 4, 0, 0]} opacity={0.7} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Productivity Trend */}
        <div className="glass-card p-6 border border-border/50 hover:border-border/80 transition-all shadow-md">
          <h3 className="text-sm font-bold tracking-wide text-foreground/90 uppercase flex items-center gap-2 mb-5">
            <span className="w-1 h-3 rounded-full bg-info" />
            Focus Score Trend
          </h3>
          
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="scoreLineGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#12121a', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', color: '#fafafa', fontSize: 11, backdropFilter: 'blur(10px)' }}
              />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hologram Pet Card + Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hologram Pet Capsule */}
        {pet && (
          <div className="glass-card p-6 flex flex-col items-center text-center border border-primary/20 hover:border-primary/40 transition-all shadow-lg relative overflow-hidden group">
            {/* Glossy inner glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            {/* Radial glow aura behind emoji */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-4">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 animate-pulse" />
              <div className="absolute inset-2 bg-gradient-to-br from-primary/20 to-info/20 rounded-full border border-primary/15 flex items-center justify-center shadow-inner" />
              <span className="text-6xl z-10 animate-[float_3.5s_ease-in-out_infinite] select-none">{PET_STAGE_EMOJI[pet.stage]}</span>
            </div>
            
            <h3 className="text-base font-extrabold tracking-tight text-foreground">{pet.name}</h3>
            
            <div className="mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/80 border border-border/50 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {PET_STAGE_LABELS[pet.stage].replace(/^[^ ]+\s+/, '')} Stage
              </span>
            </div>

            {/* Level badge */}
            <div className="mt-2.5 px-3 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest shadow-sm">
              Level {pet.level}
            </div>

            {/* Progress */}
            <div className="w-full mt-5">
              <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                <span>{pet.xp} XP Earned</span>
                <span>{petProgress?.nextStage ? `Next Evolution: ${petProgress.nextStage}` : 'MAX LEVEL'}</span>
              </div>
              <div className="h-2 bg-muted/30 border border-border/30 rounded-full overflow-hidden p-[1px]">
                <div
                  className="h-full bg-gradient-to-r from-primary via-indigo-500 to-info rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(124,58,237,0.5)]"
                  style={{ width: `${petProgress?.progressPercent || 100}%` }}
                />
              </div>
            </div>
            {pet.streak > 0 && (
              <div className="flex items-center gap-1 mt-4 text-[10px] font-extrabold text-warning uppercase tracking-widest bg-warning/5 px-2.5 py-1 rounded-full border border-warning/20">
                🔥 {pet.streak} DAY FOCUS STREAK
              </div>
            )}
          </div>
        )}

        {/* Recent Sessions Ledger */}
        <div className="glass-card p-6 col-span-1 lg:col-span-2 border border-border/50 hover:border-border/80 transition-all shadow-md flex flex-col">
          <h3 className="text-sm font-bold tracking-wide text-foreground/90 uppercase flex items-center gap-2 mb-4">
            <span className="w-1 h-3 rounded-full bg-success" />
            Recent Focus Sessions
          </h3>
          
          {sessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed border-border/40 rounded-xl bg-secondary/10">
              <span className="text-3xl mb-2">🎯</span>
              <p className="text-xs">No sessions logged yet. Ready to start your first focus sprint?</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {sessions.map((s) => (
                <div 
                  key={s.id} 
                  className="group flex items-center gap-4 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-border/20 hover:border-primary/20 transition-all duration-300 shadow-sm"
                >
                  <div 
                    className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm transition-transform group-hover:scale-110 ${
                      s.status === 'completed' 
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-500/20' 
                        : 'bg-gradient-to-br from-destructive to-rose-500 shadow-rose-500/20'
                    }`} 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{s.taskName}</p>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
                      <span>⏱️ {s.duration} MIN</span>
                      <span>·</span>
                      <span className="text-primary">{s.category}</span>
                      <span>·</span>
                      <span>{getRelativeTime(s.startTime)}</span>
                    </div>
                  </div>
                  {s.xpEarned > 0 && (
                    <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      +{s.xpEarned} XP
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  glowColor, 
  borderClass, 
  accentBg, 
  valueClass 
}: { 
  icon: string; 
  label: string; 
  value: string; 
  glowColor: string; 
  borderClass: string; 
  accentBg: string; 
  valueClass: string;
}) {
  return (
    <div className={`glass-card p-5 border flex flex-col justify-between hover-glow-card ${glowColor} ${borderClass} shadow-md`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-sm ${accentBg}`}>
          {icon}
        </div>
      </div>
      <div className="mt-1">
        <p className={`text-2xl font-black tracking-tight ${valueClass}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';
import { useTimer } from '@/hooks/useTimer';
import { formatDuration } from '@/utils/timeUtils';
import type { FocusSession } from '@/types/session';
import type { DailyStats } from '@/types/tracking';
import type { Pet } from '@/types/pet';
import { PET_STAGE_EMOJI } from '@/types/pet';

type Page = 'home' | 'session' | 'stats';

interface Props {
  onNavigate: (page: Page) => void;
}

export default function Home({ onNavigate }: Props) {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  const timer = useTimer({
    initialSeconds: timeRemaining,
    autoStart: false,
    onComplete: () => {
      // Session completed by timer
      if (session) {
        sendMessage({
          type: 'END_SESSION',
          payload: { sessionId: session.id, reason: 'completed' },
        }).then(() => loadData());
      }
    },
  });

  const loadData = async () => {
    if (!isChromeExtension()) {
      setLoading(false);
      return;
    }

    try {
      const [sessionRes, trackingRes, petRes] = await Promise.all([
        sendMessage<any>({ type: 'GET_SESSION' }),
        sendMessage<any>({ type: 'GET_TRACKING' }),
        sendMessage<any>({ type: 'GET_PET' }),
      ]);

      if (sessionRes?.session) {
        setSession(sessionRes.session);
        setTimeRemaining(sessionRes.timeRemaining || 0);
        if (sessionRes.session.status === 'active') {
          timer.reset(sessionRes.timeRemaining || 0);
          timer.start();
        }
      }

      if (trackingRes?.dailyStats) {
        setStats(trackingRes.dailyStats);
      }

      if (petRes?.pet) {
        setPet(petRes.pet);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePause = async () => {
    await sendMessage({ type: 'PAUSE_SESSION' });
    timer.pause();
    loadData();
  };

  const handleResume = async () => {
    await sendMessage({ type: 'RESUME_SESSION' });
    timer.resume();
    loadData();
  };

  const handleEnd = async () => {
    if (!session) return;
    await sendMessage({
      type: 'END_SESSION',
      payload: { sessionId: session.id, reason: 'manual' },
    });
    timer.stop();
    setSession(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-[fade-in_0.3s_ease-out]">
      {/* Active Session */}
      {session && (session.status === 'active' || session.status === 'paused') ? (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Session
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              session.status === 'active' 
                ? 'bg-success/15 text-success' 
                : 'bg-warning/15 text-warning'
            }`}>
              {session.status === 'active' ? '● Active' : '⏸ Paused'}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold truncate">{session.taskName}</h3>

          {/* Timer Ring */}
          <div className="flex justify-center py-2">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(124,58,237,0.1)" strokeWidth="8" />
                <circle
                  cx="64" cy="64" r="56" fill="none"
                  stroke="url(#timer-gradient)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - timer.progress / 100)}`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono gradient-text">
                  {timer.formattedTime}
                </span>
                <span className="text-[10px] text-muted-foreground">remaining</span>
              </div>
            </div>
          </div>

          {/* Session Controls */}
          <div className="flex gap-2">
            {session.status === 'active' ? (
              <button
                onClick={handlePause}
                className="flex-1 py-2 px-3 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                ⏸ Pause
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="flex-1 py-2 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                ▶ Resume
              </button>
            )}
            <button
              onClick={handleEnd}
              className="py-2 px-3 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
            >
              ⏹ End
            </button>
          </div>
        </div>
      ) : (
        /* No Active Session — Start Button */
        <button
          onClick={() => onNavigate('session')}
          className="w-full glass-card p-5 flex items-center gap-4 hover:border-primary/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center text-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
            🎯
          </div>
          <div className="text-left flex-1">
            <h3 className="text-sm font-semibold">Start Focus Session</h3>
            <p className="text-xs text-muted-foreground">Set a task and eliminate distractions</p>
          </div>
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
        </button>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="Focus"
          value={formatDuration(stats?.focusTime || 0)}
          color="text-success"
        />
        <StatCard
          label="Distracted"
          value={formatDuration(stats?.distractionTime || 0)}
          color="text-destructive"
        />
        <StatCard
          label="Score"
          value={`${stats?.focusScore || 0}`}
          color="text-primary"
          suffix="/100"
        />
      </div>

      {/* Pet Status */}
      {pet && (
        <div className="glass-card p-3 flex items-center gap-3">
          <span className="text-2xl">{PET_STAGE_EMOJI[pet.stage]}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">{pet.name}</span>
              <span className="text-[10px] text-muted-foreground">Lv.{pet.level}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-info rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (pet.xp % 100))}%` }}
              />
            </div>
          </div>
          {pet.streak > 0 && (
            <span className="text-xs font-medium text-warning">
              🔥 {pet.streak}
            </span>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <QuickAction
          icon="📊"
          label="View Stats"
          onClick={() => onNavigate('stats')}
        />
        <QuickAction
          icon="⚙️"
          label="Dashboard"
          onClick={() => chrome.runtime.openOptionsPage?.()}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  suffix,
}: {
  label: string;
  value: string;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="glass-card p-3 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-base font-bold ${color}`}>
        {value}
        {suffix && <span className="text-xs font-normal text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-card p-3 flex items-center gap-2 hover:border-primary/20 transition-all text-left"
    >
      <span className="text-base">{icon}</span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </button>
  );
}

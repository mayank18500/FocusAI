import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';
import { formatDuration, getRelativeTime } from '@/utils/timeUtils';
import type { DailyStats, SiteVisit } from '@/types/tracking';
import type { FocusSession } from '@/types/session';
import { SESSION_CATEGORY_LABELS } from '@/types/session';

interface Props {
  onBack: () => void;
}

export default function QuickStats({ onBack }: Props) {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!isChromeExtension()) {
      setLoading(false);
      return;
    }

    try {
      const [trackingRes, sessionRes] = await Promise.all([
        sendMessage<any>({ type: 'GET_TRACKING' }),
        sendMessage<any>({
          type: 'GET_SESSION_HISTORY',
          payload: { limit: 10 },
        }),
      ]);

      if (trackingRes?.dailyStats) setStats(trackingRes.dailyStats);
      if (sessionRes?.sessions) setSessions(sessionRes.sessions);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const focusPercent = stats
    ? Math.round(
        (stats.focusTime / Math.max(1, stats.focusTime + stats.distractionTime)) * 100
      )
    : 0;

  return (
    <div className="p-4 space-y-4 animate-[slide-up_0.3s_ease-out]">
      <button
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        ← Back
      </button>

      <h2 className="text-lg font-bold">Today's Stats</h2>

      {/* Focus vs Distraction Bar */}
      <div className="glass-card p-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-success font-medium">Focus {focusPercent}%</span>
          <span className="text-destructive font-medium">Distraction {100 - focusPercent}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-success to-emerald-400 transition-all duration-500"
            style={{ width: `${focusPercent}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-red-400 to-destructive transition-all duration-500"
            style={{ width: `${100 - focusPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatDuration(stats?.focusTime || 0)}</span>
          <span>{formatDuration(stats?.distractionTime || 0)}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Sessions" value={`${stats?.sessionCount || 0}`} icon="📋" />
        <MiniStat label="Completed" value={`${stats?.completedSessions || 0}`} icon="✅" />
        <MiniStat label="Tab Switches" value={`${stats?.tabSwitches || 0}`} icon="🔄" />
        <MiniStat label="Focus Score" value={`${stats?.focusScore || 0}/100`} icon="⚡" />
      </div>

      {/* Top Sites */}
      {stats && stats.topProductiveSites.length > 0 && (
        <div className="glass-card p-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Top Productive
          </h3>
          {stats.topProductiveSites.slice(0, 3).map((site) => (
            <div key={site.domain} className="flex justify-between items-center py-1.5">
              <span className="text-xs text-foreground truncate flex-1">{site.domain}</span>
              <span className="text-[10px] text-success font-medium ml-2">
                {formatDuration(site.totalTime)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Recent Sessions
          </h3>
          <div className="space-y-1.5">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="glass-card p-2.5 flex items-center gap-2"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  session.status === 'completed' ? 'bg-success' : 'bg-destructive'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{session.taskName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {session.duration}min · {getRelativeTime(session.startTime)}
                  </p>
                </div>
                {session.xpEarned > 0 && (
                  <span className="text-[10px] text-primary font-medium">+{session.xpEarned}XP</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="glass-card p-2.5 flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <div>
        <p className="text-xs font-bold">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

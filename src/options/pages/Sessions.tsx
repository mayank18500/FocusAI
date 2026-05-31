import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';
import { formatDuration, formatShortDate } from '@/utils/timeUtils';
import type { FocusSession, SessionCategory } from '@/types/session';
import { SESSION_CATEGORY_LABELS, SESSION_CATEGORY_COLORS } from '@/types/session';

export default function Sessions() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [filter, setFilter] = useState<SessionCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    if (!isChromeExtension()) { setLoading(false); return; }
    try {
      const res = await sendMessage<any>({ type: 'GET_SESSION_HISTORY', payload: { limit: 100 } });
      if (res?.sessions) setSessions(res.sessions);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? sessions : sessions.filter((s) => s.category === filter);
  const completed = sessions.filter((s) => s.status === 'completed');
  const totalMinutes = completed.reduce((sum, s) => sum + s.duration, 0);
  const avgDuration = completed.length > 0 ? Math.round(totalMinutes / completed.length) : 0;
  const completionRate = sessions.length > 0 ? Math.round((completed.length / sessions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sessions</h1>
        <p className="text-sm text-muted-foreground mt-1">Your focus session history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Total" value={`${sessions.length}`} />
        <MiniStat label="Completed" value={`${completed.length}`} />
        <MiniStat label="Avg Duration" value={`${avgDuration}m`} />
        <MiniStat label="Completion" value={`${completionRate}%`} />
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
        {Object.entries(SESSION_CATEGORY_LABELS).map(([key, label]) => (
          <FilterBtn key={key} active={filter === key} onClick={() => setFilter(key as SessionCategory)} label={label} />
        ))}
      </div>

      {/* Session List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-sm">No sessions yet. Start your first focus session!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((session) => (
            <div key={session.id} className="glass-card p-4 flex items-center gap-4 hover:border-primary/20 transition-all">
              <div
                className="w-1 h-12 rounded-full flex-shrink-0"
                style={{ backgroundColor: SESSION_CATEGORY_COLORS[session.category] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold truncate">{session.taskName}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    session.status === 'completed'
                      ? 'bg-success/15 text-success'
                      : 'bg-destructive/15 text-destructive'
                  }`}>
                    {session.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{SESSION_CATEGORY_LABELS[session.category]}</span>
                  <span>·</span>
                  <span>{session.duration} min</span>
                  <span>·</span>
                  <span>{formatShortDate(session.startTime)}</span>
                </div>
              </div>
              {session.xpEarned > 0 && (
                <span className="text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-full">
                  +{session.xpEarned} XP
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

function FilterBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

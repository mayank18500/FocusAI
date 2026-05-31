import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';

interface Goals {
  targets: { focusHours: number; tasks: number; sessions: number };
  progress: { focusHours: number; tasks: number; sessions: number };
}

export default function DailyGoals() {
  const [goals, setGoals] = useState<Goals | null>(null);
  const [editing, setEditing] = useState(false);
  const [targets, setTargets] = useState({ focusHours: 4, tasks: 5, sessions: 4 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    if (!isChromeExtension()) { setLoading(false); return; }
    try {
      const res = await sendMessage<any>({ type: 'GET_DAILY_GOALS' });
      if (res) {
        setGoals(res);
        setTargets(res.targets);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const saveTargets = async () => {
    await sendMessage({
      type: 'UPDATE_DAILY_GOALS',
      payload: {
        focusHoursTarget: targets.focusHours,
        tasksTarget: targets.tasks,
        sessionsTarget: targets.sessions,
      },
    });
    setEditing(false);
    loadGoals();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  const goalItems = [
    {
      label: 'Focus Hours',
      icon: '⏱',
      target: goals?.targets.focusHours || 4,
      progress: goals?.progress.focusHours || 0,
      unit: 'h',
      color: 'from-violet-500 to-purple-500',
    },
    {
      label: 'Tasks Completed',
      icon: '✅',
      target: goals?.targets.tasks || 5,
      progress: goals?.progress.tasks || 0,
      unit: '',
      color: 'from-emerald-500 to-green-500',
    },
    {
      label: 'Sessions',
      icon: '🎯',
      target: goals?.targets.sessions || 4,
      progress: goals?.progress.sessions || 0,
      unit: '',
      color: 'from-blue-500 to-cyan-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your daily productivity targets</p>
        </div>
        <button
          onClick={() => editing ? saveTargets() : setEditing(true)}
          className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          {editing ? '✓ Save' : '✏️ Edit Targets'}
        </button>
      </div>

      {/* Goal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goalItems.map((goal) => {
          const percent = Math.min(100, (goal.progress / Math.max(1, goal.target)) * 100);
          const isComplete = percent >= 100;
          return (
            <div key={goal.label} className={`glass-card p-6 text-center ${isComplete ? 'border-success/30' : ''}`}>
              <span className="text-4xl block mb-3">{goal.icon}</span>

              {/* Circular Progress */}
              <div className="relative w-28 h-28 mx-auto mb-3">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
                  <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="56" cy="56" r="48" fill="none"
                    stroke={isComplete ? '#10b981' : 'url(#goal-gradient)'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - percent / 100)}`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="goal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">
                    {goal.progress.toFixed(goal.unit === 'h' ? 1 : 0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    of {goal.target}{goal.unit}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-semibold">{goal.label}</h3>
              {isComplete && <span className="text-xs text-success mt-1 block">✓ Complete!</span>}

              {editing && (
                <div className="mt-3">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={goal.label === 'Focus Hours' ? targets.focusHours : goal.label === 'Tasks Completed' ? targets.tasks : targets.sessions}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 1;
                      if (goal.label === 'Focus Hours') setTargets({ ...targets, focusHours: v });
                      else if (goal.label === 'Tasks Completed') setTargets({ ...targets, tasks: v });
                      else setTargets({ ...targets, sessions: v });
                    }}
                    className="w-20 px-2 py-1 rounded bg-secondary border border-border text-sm text-center focus:outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

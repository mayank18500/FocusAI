import React, { useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';
import { SESSION_DURATIONS } from '@/utils/constants';
import { validateSessionForm } from '@/utils/validators';
import type { SessionCategory, SessionPriority } from '@/types/session';
import { SESSION_CATEGORY_LABELS } from '@/types/session';

interface Props {
  onBack: () => void;
}

const PRIORITIES: { value: SessionPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'border-gray-500 text-gray-400' },
  { value: 'medium', label: 'Medium', color: 'border-blue-500 text-blue-400' },
  { value: 'high', label: 'High', color: 'border-amber-500 text-amber-400' },
  { value: 'critical', label: 'Critical', color: 'border-red-500 text-red-400' },
];

const CATEGORIES: { value: SessionCategory; label: string }[] = [
  { value: 'coding', label: '💻 Coding' },
  { value: 'study', label: '📚 Study' },
  { value: 'writing', label: '✍️ Writing' },
  { value: 'design', label: '🎨 Design' },
  { value: 'research', label: '🔬 Research' },
  { value: 'reading', label: '📖 Reading' },
  { value: 'planning', label: '📋 Planning' },
  { value: 'other', label: '📌 Other' },
];

export default function QuickSession({ onBack }: Props) {
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState(25);
  const [priority, setPriority] = useState<SessionPriority>('medium');
  const [category, setCategory] = useState<SessionCategory>('coding');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    const validation = validateSessionForm({ taskName, duration });
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    setStarting(true);
    setError('');

    try {
      if (isChromeExtension()) {
        const response = await sendMessage<any>({
          type: 'START_SESSION',
          payload: { taskName, duration, priority, category },
        });

        if (response?.success) {
          onBack();
        } else {
          setError(response?.error || 'Failed to start session');
        }
      }
    } catch (err) {
      setError('Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-[slide-up_0.3s_ease-out]">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        ← Back
      </button>

      <h2 className="text-lg font-bold">New Focus Session</h2>

      {/* Task Name */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
          What are you working on?
        </label>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="e.g., Build Portfolio Website"
          className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
          maxLength={100}
          autoFocus
        />
      </div>

      {/* Duration */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
          Duration
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {SESSION_DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                duration === d.value
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
          Priority
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              onClick={() => setPriority(p.value)}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-all ${
                priority === p.value
                  ? `${p.color} bg-primary/5`
                  : 'border-border text-muted-foreground hover:border-muted-foreground/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
          Category
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-left ${
                category === c.value
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={starting || !taskName.trim()}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-info text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
      >
        {starting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Starting...
          </span>
        ) : (
          '🎯 Start Focus Session'
        )}
      </button>
    </div>
  );
}

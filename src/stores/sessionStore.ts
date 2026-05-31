// ============================================================
// FocusGuard AI — Session Store
// ============================================================

import { create } from 'zustand';
import type { FocusSession, SessionFormData, SessionStats } from '@/types/session';
import { generateId } from '@/utils/timeUtils';

interface SessionState {
  currentSession: FocusSession | null;
  sessionHistory: FocusSession[];
  isLoading: boolean;

  // Actions
  startSession: (data: SessionFormData) => FocusSession;
  endSession: (reason: 'completed' | 'cancelled' | 'manual') => void;
  pauseSession: () => void;
  resumeSession: () => void;
  updateTimeRemaining: (remaining: number) => void;
  setCurrentSession: (session: FocusSession | null) => void;
  addToHistory: (session: FocusSession) => void;
  setSessionHistory: (sessions: FocusSession[]) => void;
  getStats: () => SessionStats;
  setLoading: (loading: boolean) => void;
  hydrate: (state: Partial<SessionState>) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  sessionHistory: [],
  isLoading: false,

  startSession: (data: SessionFormData) => {
    const session: FocusSession = {
      id: generateId(),
      taskName: data.taskName,
      duration: data.duration,
      priority: data.priority,
      category: data.category,
      status: 'active',
      startTime: Date.now(),
      endTime: null,
      pausedAt: null,
      totalPausedTime: 0,
      breaks: [],
      completionPercentage: 0,
      xpEarned: 0,
      notes: '',
    };
    set({ currentSession: session });
    return session;
  },

  endSession: (reason) => {
    const { currentSession, sessionHistory } = get();
    if (!currentSession) return;

    const endedSession: FocusSession = {
      ...currentSession,
      status: reason === 'completed' ? 'completed' : 'cancelled',
      endTime: Date.now(),
    };

    set({
      currentSession: null,
      sessionHistory: [endedSession, ...sessionHistory].slice(0, 500), // Keep last 500
    });
  },

  pauseSession: () => {
    const { currentSession } = get();
    if (!currentSession || currentSession.status !== 'active') return;

    set({
      currentSession: {
        ...currentSession,
        status: 'paused',
        pausedAt: Date.now(),
        breaks: [
          ...currentSession.breaks,
          { startTime: Date.now(), endTime: null },
        ],
      },
    });
  },

  resumeSession: () => {
    const { currentSession } = get();
    if (!currentSession || currentSession.status !== 'paused' || !currentSession.pausedAt) return;

    const pauseDuration = Date.now() - currentSession.pausedAt;
    const breaks = [...currentSession.breaks];
    if (breaks.length > 0) {
      breaks[breaks.length - 1] = {
        ...breaks[breaks.length - 1],
        endTime: Date.now(),
      };
    }

    set({
      currentSession: {
        ...currentSession,
        status: 'active',
        pausedAt: null,
        totalPausedTime: currentSession.totalPausedTime + pauseDuration,
        breaks,
      },
    });
  },

  updateTimeRemaining: (_remaining: number) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const elapsed = Date.now() - currentSession.startTime - currentSession.totalPausedTime;
    const totalMs = currentSession.duration * 60 * 1000;
    const pct = Math.min(100, (elapsed / totalMs) * 100);

    set({
      currentSession: {
        ...currentSession,
        completionPercentage: Math.round(pct),
      },
    });
  },

  setCurrentSession: (session) => set({ currentSession: session }),
  addToHistory: (session) => {
    const { sessionHistory } = get();
    set({ sessionHistory: [session, ...sessionHistory].slice(0, 500) });
  },
  setSessionHistory: (sessions) => set({ sessionHistory: sessions }),
  setLoading: (loading) => set({ isLoading: loading }),

  getStats: (): SessionStats => {
    const { sessionHistory } = get();
    const completed = sessionHistory.filter((s) => s.status === 'completed');
    const cancelled = sessionHistory.filter((s) => s.status === 'cancelled');
    const totalFocusTime = completed.reduce((sum, s) => sum + s.duration, 0);

    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let checkDate = new Date(today);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasSession = completed.some((s) => {
        const sDate = new Date(s.startTime).toISOString().split('T')[0];
        return sDate === dateStr;
      });
      if (!hasSession) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      totalSessions: sessionHistory.length,
      completedSessions: completed.length,
      cancelledSessions: cancelled.length,
      totalFocusTime,
      averageSessionLength:
        completed.length > 0 ? totalFocusTime / completed.length : 0,
      completionRate:
        sessionHistory.length > 0
          ? Math.round((completed.length / sessionHistory.length) * 100)
          : 0,
      longestSession:
        completed.length > 0
          ? Math.max(...completed.map((s) => s.duration))
          : 0,
      currentStreak: streak,
      bestStreak: streak, // Would need historical data for best
    };
  },

  hydrate: (state) => set(state),
}));

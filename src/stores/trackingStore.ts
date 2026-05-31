// ============================================================
// FocusGuard AI — Tracking Store
// ============================================================

import { create } from 'zustand';
import type { DailyStats, SiteVisit, SiteSummary, WeeklyReport } from '@/types/tracking';
import { getTodayISO, getStartOfWeek } from '@/utils/timeUtils';
import { calculateFocusScore } from '@/utils/xpCalculator';

function createEmptyDailyStats(date?: string): DailyStats {
  return {
    date: date || getTodayISO(),
    focusTime: 0,
    distractionTime: 0,
    neutralTime: 0,
    sessionCount: 0,
    completedSessions: 0,
    tabSwitches: 0,
    sitesVisited: 0,
    focusScore: 0,
    topProductiveSites: [],
    topDistractingSites: [],
  };
}

interface TrackingState {
  currentVisit: SiteVisit | null;
  todayStats: DailyStats;
  recentVisits: SiteVisit[];
  weeklyData: DailyStats[];

  // Actions
  setCurrentVisit: (visit: SiteVisit | null) => void;
  endCurrentVisit: () => void;
  addFocusTime: (seconds: number) => void;
  addDistractionTime: (seconds: number) => void;
  addNeutralTime: (seconds: number) => void;
  incrementTabSwitches: () => void;
  incrementSessionCount: (completed: boolean) => void;
  updateSiteSummaries: (domain: string, duration: number, isDistraction: boolean) => void;
  recalculateFocusScore: () => void;
  resetDailyStats: () => void;
  addDailyToWeekly: () => void;
  getWeeklyReport: () => WeeklyReport;
  hydrate: (state: Partial<TrackingState>) => void;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  currentVisit: null,
  todayStats: createEmptyDailyStats(),
  recentVisits: [],
  weeklyData: [],

  setCurrentVisit: (visit) => set({ currentVisit: visit }),

  endCurrentVisit: () => {
    const { currentVisit, recentVisits } = get();
    if (!currentVisit) return;

    const endedVisit: SiteVisit = {
      ...currentVisit,
      endTime: Date.now(),
      duration: Math.floor((Date.now() - currentVisit.startTime) / 1000),
    };

    set({
      currentVisit: null,
      recentVisits: [endedVisit, ...recentVisits].slice(0, 200),
    });
  },

  addFocusTime: (seconds) => {
    const { todayStats } = get();
    set({
      todayStats: {
        ...todayStats,
        focusTime: todayStats.focusTime + seconds,
      },
    });
  },

  addDistractionTime: (seconds) => {
    const { todayStats } = get();
    set({
      todayStats: {
        ...todayStats,
        distractionTime: todayStats.distractionTime + seconds,
      },
    });
  },

  addNeutralTime: (seconds) => {
    const { todayStats } = get();
    set({
      todayStats: {
        ...todayStats,
        neutralTime: todayStats.neutralTime + seconds,
      },
    });
  },

  incrementTabSwitches: () => {
    const { todayStats } = get();
    set({
      todayStats: {
        ...todayStats,
        tabSwitches: todayStats.tabSwitches + 1,
      },
    });
  },

  incrementSessionCount: (completed) => {
    const { todayStats } = get();
    set({
      todayStats: {
        ...todayStats,
        sessionCount: todayStats.sessionCount + 1,
        completedSessions: todayStats.completedSessions + (completed ? 1 : 0),
      },
    });
  },

  updateSiteSummaries: (domain, duration, isDistraction) => {
    const { todayStats } = get();
    const key = isDistraction ? 'topDistractingSites' : 'topProductiveSites';
    const existing = [...todayStats[key]];
    const idx = existing.findIndex((s) => s.domain === domain);

    if (idx >= 0) {
      existing[idx] = {
        ...existing[idx],
        totalTime: existing[idx].totalTime + duration,
        visits: existing[idx].visits + 1,
      };
    } else {
      existing.push({ domain, totalTime: duration, visits: 1 });
    }

    // Sort by time, keep top 10
    existing.sort((a, b) => b.totalTime - a.totalTime);
    const top = existing.slice(0, 10);

    set({
      todayStats: {
        ...todayStats,
        [key]: top,
        sitesVisited: todayStats.sitesVisited + (idx < 0 ? 1 : 0),
      },
    });
  },

  recalculateFocusScore: () => {
    const { todayStats } = get();
    const score = calculateFocusScore(
      todayStats.focusTime,
      todayStats.distractionTime,
      todayStats.completedSessions,
      todayStats.sessionCount,
      todayStats.tabSwitches
    );
    set({
      todayStats: { ...todayStats, focusScore: score },
    });
  },

  resetDailyStats: () => {
    const { todayStats, weeklyData } = get();
    // Archive today's stats to weekly data if it has data
    if (todayStats.focusTime > 0 || todayStats.sessionCount > 0) {
      set({
        weeklyData: [...weeklyData, todayStats].slice(-30), // Keep 30 days
        todayStats: createEmptyDailyStats(),
        recentVisits: [],
        currentVisit: null,
      });
    } else {
      set({ todayStats: createEmptyDailyStats() });
    }
  },

  addDailyToWeekly: () => {
    const { todayStats, weeklyData } = get();
    const existingIdx = weeklyData.findIndex((d) => d.date === todayStats.date);
    if (existingIdx >= 0) {
      const updated = [...weeklyData];
      updated[existingIdx] = todayStats;
      set({ weeklyData: updated });
    } else {
      set({ weeklyData: [...weeklyData, todayStats].slice(-30) });
    }
  },

  getWeeklyReport: (): WeeklyReport => {
    const { weeklyData, todayStats } = get();
    const weekStart = getStartOfWeek();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekDays = [...weeklyData, todayStats].filter((d) => {
      const date = new Date(d.date);
      return date >= weekStart && date <= weekEnd;
    });

    const totalFocusTime = weekDays.reduce((s, d) => s + d.focusTime, 0);
    const totalDistractionTime = weekDays.reduce((s, d) => s + d.distractionTime, 0);
    const sessionsCompleted = weekDays.reduce((s, d) => s + d.completedSessions, 0);
    const sessionsTotal = weekDays.reduce((s, d) => s + d.sessionCount, 0);

    // Aggregate site summaries
    const productiveMap = new Map<string, SiteSummary>();
    const distractingMap = new Map<string, SiteSummary>();
    for (const day of weekDays) {
      for (const site of day.topProductiveSites) {
        const existing = productiveMap.get(site.domain);
        if (existing) {
          productiveMap.set(site.domain, {
            ...existing,
            totalTime: existing.totalTime + site.totalTime,
            visits: existing.visits + site.visits,
          });
        } else {
          productiveMap.set(site.domain, { ...site });
        }
      }
      for (const site of day.topDistractingSites) {
        const existing = distractingMap.get(site.domain);
        if (existing) {
          distractingMap.set(site.domain, {
            ...existing,
            totalTime: existing.totalTime + site.totalTime,
            visits: existing.visits + site.visits,
          });
        } else {
          distractingMap.set(site.domain, { ...site });
        }
      }
    }

    const avgScore =
      weekDays.length > 0
        ? Math.round(weekDays.reduce((s, d) => s + d.focusScore, 0) / weekDays.length)
        : 0;

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalFocusTime,
      totalDistractionTime,
      dailyStats: weekDays,
      topProductiveSites: Array.from(productiveMap.values())
        .sort((a, b) => b.totalTime - a.totalTime)
        .slice(0, 10),
      topDistractingSites: Array.from(distractingMap.values())
        .sort((a, b) => b.totalTime - a.totalTime)
        .slice(0, 10),
      focusScore: avgScore,
      streakDays: weekDays.filter((d) => d.completedSessions > 0).length,
      sessionsCompleted,
      sessionsTotal,
      completionRate: sessionsTotal > 0 ? Math.round((sessionsCompleted / sessionsTotal) * 100) : 0,
      achievementsUnlocked: 0,
      comparisonToPrevWeek: {
        focusTimeChange: 0,
        distractionTimeChange: 0,
        focusScoreChange: 0,
      },
      aiInsights: [],
    };
  },

  hydrate: (state) => set(state),
}));

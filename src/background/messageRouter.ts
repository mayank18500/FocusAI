// ============================================================
// FocusGuard AI — Message Router
// Central handler for all cross-context messages
// ============================================================

import type { ExtensionMessage } from '@/types/messages';
import { storageService } from '@/services/storageService';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { startSession, endSession, pauseSession, resumeSession } from './sessionManager';
import { checkIntent, getCoachAdvice } from '@/services/geminiService';
import { getTabInfo, closeTabs } from './tabManager';
import type { FocusSession } from '@/types/session';
import type { DailyStats } from '@/types/tracking';
import type { Pet } from '@/types/pet';
import type { Achievement } from '@/types/achievements';
import { ACHIEVEMENT_DEFINITIONS } from '@/types/achievements';
import { getTodayISO } from '@/utils/timeUtils';
import { isBlocked } from '@/utils/urlMatcher';
import { cleanApiKey } from '@/utils/validators';

export async function handleMessage(
  message: ExtensionMessage,
  _sender: chrome.runtime.MessageSender
): Promise<unknown> {
  switch (message.type) {
    // ------ Session Messages ------
    case 'START_SESSION':
      return startSession(message.payload);

    case 'END_SESSION':
      return endSession(message.payload.sessionId, message.payload.reason);

    case 'PAUSE_SESSION':
      return pauseSession();

    case 'RESUME_SESSION':
      return resumeSession();

    case 'GET_SESSION': {
      const session = await storageService.get<FocusSession | null>('session_current', null);
      let timeRemaining = 0;
      if (session && session.status === 'active') {
        const elapsed = Date.now() - session.startTime - session.totalPausedTime;
        timeRemaining = Math.max(0, session.duration * 60 - Math.floor(elapsed / 1000));
      } else if (session && session.status === 'paused' && session.pausedAt) {
        const elapsed = session.pausedAt - session.startTime - session.totalPausedTime;
        timeRemaining = Math.max(0, session.duration * 60 - Math.floor(elapsed / 1000));
      }
      return { session, timeRemaining };
    }

    case 'GET_SESSION_HISTORY': {
      const history = await storageService.get<FocusSession[]>('session_history', []);
      const limit = message.payload?.limit || 50;
      const offset = message.payload?.offset || 0;
      let filtered = history;
      if (message.payload?.category) {
        filtered = history.filter((s) => s.category === message.payload!.category);
      }
      return {
        sessions: filtered.slice(offset, offset + limit),
        total: filtered.length,
      };
    }

    // ------ Blocking Messages ------
    case 'CHECK_BLOCKED': {
      const session = await storageService.get<FocusSession | null>('session_current', null);
      const settings = await storageService.get('settings', DEFAULT_SETTINGS);
      const allBlocked = [...settings.blockedSites, ...settings.customBlockedSites];
      const blocked = session?.status === 'active' && settings.blockingEnabled &&
        isBlocked(message.payload.url, allBlocked);

      let timeRemaining = 0;
      if (session && session.status === 'active') {
        const elapsed = Date.now() - session.startTime - session.totalPausedTime;
        timeRemaining = Math.max(0, session.duration * 60 - Math.floor(elapsed / 1000));
      }

      return {
        isBlocked: blocked,
        sessionActive: session?.status === 'active',
        taskName: session?.taskName,
        timeRemaining,
      };
    }

    case 'OVERRIDE_BLOCK': {
      const overrides = await storageService.get<Record<string, number>>('overrides', {});
      overrides[message.payload.url] = Date.now() + message.payload.duration * 60 * 1000;
      await storageService.set('overrides', overrides);
      return { success: true };
    }

    // ------ AI Intent Messages ------
    case 'CHECK_INTENT': {
      const settings = await storageService.get('settings', DEFAULT_SETTINGS);
      if (!settings.geminiApiKey) {
        return {
          classification: 'neutral' as const,
          message: 'AI intent check is not configured. Please add your Gemini API key in settings.',
          confidence: 0,
        };
      }
      return checkIntent(settings.geminiApiKey, message.payload);
    }

    // ------ Tracking Messages ------
    case 'GET_TRACKING': {
      const today = createEmptyStats();
      const todayStats = await storageService.get<DailyStats>('tracking_today', today);
      const visits = await storageService.get('tracking_visits', []);
      return { dailyStats: todayStats, recentSites: visits };
    }

    case 'GET_WEEKLY_REPORT': {
      const weekly = await storageService.get<DailyStats[]>('tracking_weekly', []);
      const todayStats = await storageService.get<DailyStats>('tracking_today', createEmptyStats());

      // Build a simple weekly report
      const allDays = [...weekly, todayStats];
      const totalFocus = allDays.reduce((s, d) => s + d.focusTime, 0);
      const totalDistraction = allDays.reduce((s, d) => s + d.distractionTime, 0);
      const sessionsCompleted = allDays.reduce((s, d) => s + d.completedSessions, 0);
      const sessionsTotal = allDays.reduce((s, d) => s + d.sessionCount, 0);
      const avgScore = allDays.length > 0
        ? Math.round(allDays.reduce((s, d) => s + d.focusScore, 0) / allDays.length)
        : 0;

      return {
        report: {
          weekStart: allDays[0]?.date || getTodayISO(),
          weekEnd: getTodayISO(),
          totalFocusTime: totalFocus,
          totalDistractionTime: totalDistraction,
          dailyStats: allDays,
          topProductiveSites: todayStats.topProductiveSites,
          topDistractingSites: todayStats.topDistractingSites,
          focusScore: avgScore,
          streakDays: allDays.filter((d) => d.completedSessions > 0).length,
          sessionsCompleted,
          sessionsTotal,
          completionRate: sessionsTotal > 0 ? Math.round((sessionsCompleted / sessionsTotal) * 100) : 0,
          achievementsUnlocked: 0,
          comparisonToPrevWeek: { focusTimeChange: 0, distractionTimeChange: 0, focusScoreChange: 0 },
          aiInsights: [],
        },
      };
    }

    // ------ Pet Messages ------
    case 'GET_PET': {
      const pet = await storageService.get<Pet>('pet', {
        name: 'FocusBuddy',
        stage: 'seed',
        xp: 0,
        level: 1,
        streak: 0,
        bestStreak: 0,
        lastFedDate: null,
        createdAt: Date.now(),
        totalXpEarned: 0,
        evolutionHistory: [],
      });
      return { pet };
    }

    // ------ Achievement Messages ------
    case 'GET_ACHIEVEMENTS': {
      const achievements = await storageService.get<Achievement[]>('achievements',
        ACHIEVEMENT_DEFINITIONS.map((def) => ({
          ...def,
          progress: 0,
          unlocked: false,
          unlockedAt: null,
        }))
      );
      const recentUnlocks = achievements
        .filter((a) => a.unlocked)
        .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
        .slice(0, 5);
      return { achievements, recentUnlocks };
    }

    // ------ Settings Messages ------
    case 'GET_SETTINGS': {
      const settings = await storageService.get('settings', DEFAULT_SETTINGS);
      return { settings };
    }

    case 'UPDATE_SETTINGS': {
      const current = await storageService.get('settings', DEFAULT_SETTINGS);
      const payload = { ...message.payload };
      if (payload.geminiApiKey !== undefined) {
        payload.geminiApiKey = cleanApiKey(payload.geminiApiKey);
      }
      const updated = { ...current, ...payload };
      await storageService.set('settings', updated);
      return { settings: updated };
    }

    // ------ Tab Management ------
    case 'GET_TAB_INFO':
      return getTabInfo();

    case 'CLOSE_TABS':
      return closeTabs(message.payload.tabIds);

    // ------ AI Coach ------
    case 'GET_COACH_ADVICE': {
      const settings = await storageService.get('settings', DEFAULT_SETTINGS);
      if (!settings.geminiApiKey) {
        return {
          advice: 'Please configure your Gemini API key in settings to get AI coaching.',
          recommendations: ['Go to Settings → AI → Enter your Gemini API key'],
          insights: [],
        };
      }

      const history = await storageService.get<DailyStats[]>('tracking_weekly', []);
      const sessions = await storageService.get<FocusSession[]>('session_history', []);
      const completed = sessions.filter((s) => s.status === 'completed');
      const todayStats = await storageService.get<DailyStats>('tracking_today', createEmptyStats());

      return getCoachAdvice(settings.geminiApiKey, {
        focusHistory: [...history, todayStats].map((d) => ({
          date: d.date,
          focusTime: d.focusTime,
          distractionTime: d.distractionTime,
          sessions: d.sessionCount,
        })),
        currentStreak: 0,
        totalSessions: completed.length,
        averageSessionLength: completed.length > 0
          ? completed.reduce((s, sess) => s + sess.duration, 0) / completed.length
          : 0,
        topDistractions: todayStats.topDistractingSites.map((s) => s.domain),
        question: message.payload?.question,
      });
    }

    // ------ Daily Goals ------
    case 'GET_DAILY_GOALS': {
      const settings = await storageService.get('settings', DEFAULT_SETTINGS);
      const todayStats = await storageService.get<DailyStats>('tracking_today', createEmptyStats());
      return {
        targets: {
          focusHours: settings.dailyFocusHoursTarget,
          tasks: settings.dailyTasksTarget,
          sessions: settings.dailySessionsTarget,
        },
        progress: {
          focusHours: todayStats.focusTime / 3600,
          tasks: todayStats.completedSessions,
          sessions: todayStats.sessionCount,
        },
      };
    }

    case 'UPDATE_DAILY_GOALS': {
      const current = await storageService.get('settings', DEFAULT_SETTINGS);
      const updated = {
        ...current,
        dailyFocusHoursTarget: message.payload.focusHoursTarget ?? current.dailyFocusHoursTarget,
        dailyTasksTarget: message.payload.tasksTarget ?? current.dailyTasksTarget,
        dailySessionsTarget: message.payload.sessionsTarget ?? current.dailySessionsTarget,
      };
      await storageService.set('settings', updated);
      return { success: true };
    }

    default:
      console.warn('[FocusGuard] Unknown message type:', (message as ExtensionMessage).type);
      return { error: 'Unknown message type' };
  }
}

function createEmptyStats(): DailyStats {
  return {
    date: getTodayISO(),
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

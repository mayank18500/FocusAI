// ============================================================
// FocusGuard AI — Session Manager (Background)
// ============================================================

import { storageService } from '@/services/storageService';
import type { FocusSession, SessionFormData } from '@/types/session';
import { generateId, getTodayISO } from '@/utils/timeUtils';
import { calculateSessionXP, getStageForXP, calculateLevel } from '@/utils/xpCalculator';
import { ALARM_NAMES } from '@/utils/constants';
import { broadcastToTabs } from '@/services/messagingService';
import type { Pet } from '@/types/pet';
import type { DailyStats } from '@/types/tracking';
import type { Achievement } from '@/types/achievements';
import { ACHIEVEMENT_DEFINITIONS } from '@/types/achievements';

export async function startSession(data: SessionFormData) {
  // Check if there's already an active session
  const existing = await storageService.get<FocusSession | null>('session_current', null);
  if (existing && (existing.status === 'active' || existing.status === 'paused')) {
    return { success: false, error: 'A session is already active' };
  }

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

  await storageService.set('session_current', session);

  // Set alarm for session end
  chrome.alarms.create(ALARM_NAMES.SESSION_TIMER, {
    delayInMinutes: data.duration,
  });

  // Notify content scripts to show overlay
  broadcastToTabs({
    type: 'SHOW_FOCUS_OVERLAY',
    payload: {
      taskName: session.taskName,
      timeRemaining: session.duration * 60,
      totalDuration: session.duration * 60,
    },
  });

  return { success: true, session };
}

export async function endSession(
  sessionId: string,
  reason: 'completed' | 'cancelled' | 'manual'
) {
  const session = await storageService.get<FocusSession | null>('session_current', null);
  if (!session || session.id !== sessionId) {
    return { success: false, error: 'Session not found' };
  }

  // Calculate XP
  let xpEarned = 0;
  const newAchievements: Achievement[] = [];

  if (reason === 'completed') {
    const pet = await storageService.get<Pet>('pet', {
      name: 'FocusBuddy', stage: 'seed', xp: 0, level: 1,
      streak: 0, bestStreak: 0, lastFedDate: null,
      createdAt: Date.now(), totalXpEarned: 0, evolutionHistory: [],
    });

    xpEarned = calculateSessionXP(session.duration, false, pet.streak);

    // Update pet
    const newXP = pet.xp + xpEarned;
    const today = getTodayISO();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    let newStreak = pet.streak;
    if (pet.lastFedDate !== today) {
      newStreak = pet.lastFedDate === yesterdayISO ? pet.streak + 1 : 1;
    }

    const updatedPet: Pet = {
      ...pet,
      xp: newXP,
      totalXpEarned: pet.totalXpEarned + xpEarned,
      level: calculateLevel(newXP),
      stage: getStageForXP(newXP),
      streak: newStreak,
      bestStreak: Math.max(pet.bestStreak, newStreak),
      lastFedDate: today,
    };
    await storageService.set('pet', updatedPet);

    // Update tracking
    const todayStats = await storageService.get<DailyStats>('tracking_today', {
      date: today, focusTime: 0, distractionTime: 0, neutralTime: 0,
      sessionCount: 0, completedSessions: 0, tabSwitches: 0,
      sitesVisited: 0, focusScore: 0, topProductiveSites: [], topDistractingSites: [],
    });
    todayStats.completedSessions += 1;
    todayStats.sessionCount += 1;
    todayStats.focusTime += session.duration * 60;
    await storageService.set('tracking_today', todayStats);

    // Check achievements
    const history = await storageService.get<FocusSession[]>('session_history', []);
    const completedCount = history.filter((s) => s.status === 'completed').length + 1;
    const totalFocusMinutes = history
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + s.duration, 0) + session.duration;

    const achievements = await storageService.get<Achievement[]>('achievements',
      ACHIEVEMENT_DEFINITIONS.map((def) => ({ ...def, progress: 0, unlocked: false, unlockedAt: null }))
    );

    const checks = [
      { id: 'first_session', value: completedCount },
      { id: 'sessions_10', value: completedCount },
      { id: 'sessions_50', value: completedCount },
      { id: 'sessions_100', value: completedCount },
      { id: 'sessions_500', value: completedCount },
      { id: 'sessions_1000', value: completedCount },
      { id: 'time_1h', value: totalFocusMinutes },
      { id: 'time_5h', value: totalFocusMinutes },
      { id: 'time_25h', value: totalFocusMinutes },
      { id: 'time_100h', value: totalFocusMinutes },
      { id: 'time_500h', value: totalFocusMinutes },
      { id: 'streak_3', value: newStreak },
      { id: 'streak_7', value: newStreak },
      { id: 'streak_14', value: newStreak },
      { id: 'streak_30', value: newStreak },
      { id: 'streak_100', value: newStreak },
    ];

    if (session.duration >= 120) {
      checks.push({ id: 'marathon_session', value: 1 });
    }

    const hour = new Date().getHours();
    if (hour < 7) checks.push({ id: 'early_bird', value: 1 });
    if (hour >= 23) checks.push({ id: 'night_owl', value: 1 });

    for (const check of checks) {
      const idx = achievements.findIndex((a) => a.id === check.id);
      if (idx >= 0 && !achievements[idx].unlocked) {
        achievements[idx].progress = Math.min(check.value, achievements[idx].requirement);
        if (check.value >= achievements[idx].requirement) {
          achievements[idx].unlocked = true;
          achievements[idx].unlockedAt = Date.now();
          newAchievements.push(achievements[idx]);

          // Show notification for achievement
          chrome.notifications.create(`fg_achievement_${achievements[idx].id}`, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
            title: '🏆 Achievement Unlocked!',
            message: `${achievements[idx].icon} ${achievements[idx].title}: ${achievements[idx].description}`,
          });
        }
      }
    }

    await storageService.set('achievements', achievements);
  } else {
    // Track cancelled/manual sessions
    const todayStats = await storageService.get<DailyStats>('tracking_today', {
      date: getTodayISO(), focusTime: 0, distractionTime: 0, neutralTime: 0,
      sessionCount: 0, completedSessions: 0, tabSwitches: 0,
      sitesVisited: 0, focusScore: 0, topProductiveSites: [], topDistractingSites: [],
    });
    todayStats.sessionCount += 1;
    const elapsed = Math.floor((Date.now() - session.startTime - session.totalPausedTime) / 1000);
    todayStats.focusTime += Math.max(0, elapsed);
    await storageService.set('tracking_today', todayStats);
  }

  // Update session and history
  const endedSession: FocusSession = {
    ...session,
    status: reason === 'completed' ? 'completed' : 'cancelled',
    endTime: Date.now(),
    xpEarned,
  };

  const history = await storageService.get<FocusSession[]>('session_history', []);
  await storageService.set('session_history', [endedSession, ...history].slice(0, 500));
  await storageService.set('session_current', null);

  // Clear session alarm
  chrome.alarms.clear(ALARM_NAMES.SESSION_TIMER);

  // Hide focus overlay
  broadcastToTabs({ type: 'HIDE_FOCUS_OVERLAY' });

  // Show completion notification
  if (reason === 'completed') {
    chrome.notifications.create('fg_session_complete', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: '🎉 Focus Session Complete!',
      message: `Great job! You earned ${xpEarned} XP for completing "${session.taskName}".`,
    });
  }

  return { success: true, xpEarned, achievements: newAchievements };
}

export async function pauseSession() {
  const session = await storageService.get<FocusSession | null>('session_current', null);
  if (!session || session.status !== 'active') {
    return { success: false, error: 'No active session to pause' };
  }

  const paused: FocusSession = {
    ...session,
    status: 'paused',
    pausedAt: Date.now(),
    breaks: [...session.breaks, { startTime: Date.now(), endTime: null }],
  };

  await storageService.set('session_current', paused);
  chrome.alarms.clear(ALARM_NAMES.SESSION_TIMER);

  return { success: true };
}

export async function resumeSession() {
  const session = await storageService.get<FocusSession | null>('session_current', null);
  if (!session || session.status !== 'paused' || !session.pausedAt) {
    return { success: false, error: 'No paused session to resume' };
  }

  const pauseDuration = Date.now() - session.pausedAt;
  const breaks = [...session.breaks];
  if (breaks.length > 0) {
    breaks[breaks.length - 1] = { ...breaks[breaks.length - 1], endTime: Date.now() };
  }

  const resumed: FocusSession = {
    ...session,
    status: 'active',
    pausedAt: null,
    totalPausedTime: session.totalPausedTime + pauseDuration,
    breaks,
  };

  await storageService.set('session_current', resumed);

  // Recalculate remaining time and set alarm
  const elapsed = Date.now() - session.startTime - resumed.totalPausedTime;
  const remainingMs = session.duration * 60 * 1000 - elapsed;

  if (remainingMs > 0) {
    chrome.alarms.create(ALARM_NAMES.SESSION_TIMER, {
      delayInMinutes: remainingMs / 60000,
    });
  }

  return { success: true };
}

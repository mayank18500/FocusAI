// ============================================================
// FocusGuard AI — Notification Engine (Background)
// ============================================================

import { storageService } from '@/services/storageService';
import { DEFAULT_SETTINGS } from '@/types/settings';
import type { DailyStats } from '@/types/tracking';
import { getTodayISO, formatDuration } from '@/utils/timeUtils';

/**
 * Check for distraction threshold and send notifications.
 */
export async function checkDistractionThreshold(): Promise<void> {
  const settings = await storageService.get('settings', DEFAULT_SETTINGS);
  if (!settings.notificationsEnabled) return;

  const todayStats = await storageService.get<DailyStats>('tracking_today', {
    date: getTodayISO(),
    focusTime: 0, distractionTime: 0, neutralTime: 0,
    sessionCount: 0, completedSessions: 0, tabSwitches: 0,
    sitesVisited: 0, focusScore: 0, topProductiveSites: [], topDistractingSites: [],
  });

  // Check if distraction time exceeds threshold (10 minutes)
  const thresholdMinutes = settings.notificationFrequency === 'high' ? 5 :
    settings.notificationFrequency === 'medium' ? 10 : 20;

  if (todayStats.distractionTime >= thresholdMinutes * 60) {
    // Only notify once per threshold interval
    const lastNotified = await storageService.get<number>('fg_last_distraction_notify' as any, 0);
    const timeSinceLastNotify = Date.now() - lastNotified;

    if (timeSinceLastNotify > thresholdMinutes * 60 * 1000) {
      chrome.notifications.create('fg_distraction_alert', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
        title: '⚠️ Distraction Alert',
        message: `You've been distracted for ${formatDuration(todayStats.distractionTime)}. Would you like to start a 25-minute focus sprint?`,
        buttons: [
          { title: '🎯 Start Focus Sprint' },
          { title: '⏰ Remind me later' },
        ],
        requireInteraction: true,
      });
      await storageService.set('fg_last_distraction_notify' as any, Date.now());
    }
  }
}

/**
 * Check for excessive tab switching and notify.
 */
export async function checkTabSwitching(): Promise<void> {
  const settings = await storageService.get('settings', DEFAULT_SETTINGS);
  if (!settings.notificationsEnabled) return;

  const todayStats = await storageService.get<DailyStats>('tracking_today', {
    date: getTodayISO(),
    focusTime: 0, distractionTime: 0, neutralTime: 0,
    sessionCount: 0, completedSessions: 0, tabSwitches: 0,
    sitesVisited: 0, focusScore: 0, topProductiveSites: [], topDistractingSites: [],
  });

  // Check if tab switches are excessive
  if (todayStats.tabSwitches > 50) {
    const lastNotified = await storageService.get<number>('fg_last_tabswitch_notify' as any, 0);
    const timeSinceLastNotify = Date.now() - lastNotified;

    if (timeSinceLastNotify > 30 * 60 * 1000) { // Max once per 30 minutes
      chrome.notifications.create('fg_tab_switching', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
        title: '🔄 Tab Switching Alert',
        message: `Frequent tab switching detected (${todayStats.tabSwitches} switches today). Try focusing on a single task for better productivity.`,
      });
      await storageService.set('fg_last_tabswitch_notify' as any, Date.now());
    }
  }
}

/**
 * Send session completion reminder.
 */
export function sendSessionCompleteNotification(taskName: string, xpEarned: number): void {
  chrome.notifications.create('fg_session_complete', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
    title: '🎉 Focus Session Complete!',
    message: `Great job completing "${taskName}"! You earned ${xpEarned} XP.`,
  });
}

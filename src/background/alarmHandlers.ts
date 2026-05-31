// ============================================================
// FocusGuard AI — Alarm Handlers (Background)
// ============================================================

import { storageService } from '@/services/storageService';
import { ALARM_NAMES } from '@/utils/constants';
import type { FocusSession } from '@/types/session';
import { endSession } from './sessionManager';
import { checkDistractionThreshold, checkTabSwitching } from './notificationEngine';

/**
 * Set up recurring alarms.
 */
export function setupAlarms(): void {
  // Periodic distraction check (every 5 minutes)
  chrome.alarms.create(ALARM_NAMES.DISTRACTION_CHECK, {
    periodInMinutes: 5,
  });

  // Tab check (every 10 minutes)
  chrome.alarms.create(ALARM_NAMES.TAB_CHECK, {
    periodInMinutes: 10,
  });

  // Tracking aggregation (every 5 minutes)
  chrome.alarms.create(ALARM_NAMES.TRACKING_AGGREGATE, {
    periodInMinutes: 5,
  });

  console.log('[FocusGuard] Alarms set up');
}

/**
 * Handle alarm events.
 */
export async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  switch (alarm.name) {
    case ALARM_NAMES.SESSION_TIMER: {
      // Session time is up — auto-complete
      const session = await storageService.get<FocusSession | null>('session_current', null);
      if (session && session.status === 'active') {
        await endSession(session.id, 'completed');
      }
      break;
    }

    case ALARM_NAMES.DISTRACTION_CHECK:
      await checkDistractionThreshold();
      break;

    case ALARM_NAMES.TAB_CHECK:
      await checkTabSwitching();
      break;

    case ALARM_NAMES.TRACKING_AGGREGATE: {
      // Persist current tracking data
      // This is handled by the tracking engine's periodic updates
      break;
    }

    case ALARM_NAMES.DAILY_RESET: {
      // Archive today's stats and reset
      // This is handled by the tracking engine's date check
      break;
    }

    default:
      console.log('[FocusGuard] Unknown alarm:', alarm.name);
  }
}

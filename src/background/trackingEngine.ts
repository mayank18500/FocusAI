// ============================================================
// FocusGuard AI — Tracking Engine (Background)
// ============================================================

import { storageService } from '@/services/storageService';
import { extractDomain, isChromeInternal } from '@/utils/urlMatcher';
import { DEFAULT_DISTRACTING_DOMAINS, DEFAULT_PRODUCTIVE_DOMAINS } from '@/types/tracking';
import type { DailyStats, SiteCategory, SiteVisit } from '@/types/tracking';
import { generateId, getTodayISO } from '@/utils/timeUtils';
import { calculateFocusScore } from '@/utils/xpCalculator';

let currentTabUrl = '';
let currentTabTitle = '';
let lastTrackTime = Date.now();
let tabSwitchCount = 0;
let lastTabSwitchTime = 0;

export function initializeTracking() {
  lastTrackTime = Date.now();
  // Set up periodic tracking (every 30 seconds)
  setInterval(updateActiveTime, 30000);
}

export function cleanupTracking() {
  // Finalize any current tracking
}

/**
 * Handle tab activation or URL change.
 */
export async function handleTabChange(url: string, title: string) {
  if (isChromeInternal(url)) return;

  const now = Date.now();
  const domain = extractDomain(url);

  // Record time spent on previous tab
  if (currentTabUrl && currentTabUrl !== url) {
    const timeSpent = Math.floor((now - lastTrackTime) / 1000);
    if (timeSpent > 1) {
      await recordTimeSpent(currentTabUrl, currentTabTitle, timeSpent);
    }

    // Track tab switches
    tabSwitchCount++;
    const timeSinceLastSwitch = now - lastTabSwitchTime;
    lastTabSwitchTime = now;

    // Update tab switch count in daily stats
    const todayStats = await getCurrentDailyStats();
    todayStats.tabSwitches = tabSwitchCount;
    await storageService.set('tracking_today', todayStats);

    // Check for excessive tab switching (more than 10 in 2 minutes)
    if (tabSwitchCount > 10 && timeSinceLastSwitch < 120000) {
      // Will be handled by notification engine
    }
  }

  currentTabUrl = url;
  currentTabTitle = title;
  lastTrackTime = now;
}

/**
 * Periodic update of active time tracking.
 */
async function updateActiveTime() {
  if (!currentTabUrl || isChromeInternal(currentTabUrl)) return;

  const now = Date.now();
  const timeSpent = Math.floor((now - lastTrackTime) / 1000);

  if (timeSpent > 1) {
    await recordTimeSpent(currentTabUrl, currentTabTitle, timeSpent);
    lastTrackTime = now;
  }
}

/**
 * Record time spent on a site.
 */
async function recordTimeSpent(url: string, title: string, seconds: number) {
  const domain = extractDomain(url);
  if (!domain) return;

  const category = categorizeSite(domain);
  const todayStats = await getCurrentDailyStats();

  // Update time counters
  switch (category) {
    case 'productive':
      todayStats.focusTime += seconds;
      break;
    case 'distracting':
      todayStats.distractionTime += seconds;
      break;
    default:
      todayStats.neutralTime += seconds;
      break;
  }

  // Update site summaries
  const isDistraction = category === 'distracting';
  const key = isDistraction ? 'topDistractingSites' : 'topProductiveSites';

  if (category !== 'unknown' && category !== 'neutral') {
    const summaries = [...todayStats[key]];
    const idx = summaries.findIndex((s) => s.domain === domain);

    if (idx >= 0) {
      summaries[idx] = {
        ...summaries[idx],
        totalTime: summaries[idx].totalTime + seconds,
      };
    } else {
      summaries.push({ domain, totalTime: seconds, visits: 1 });
      todayStats.sitesVisited++;
    }

    summaries.sort((a, b) => b.totalTime - a.totalTime);
    todayStats[key] = summaries.slice(0, 10);
  }

  // Recalculate focus score
  todayStats.focusScore = calculateFocusScore(
    todayStats.focusTime,
    todayStats.distractionTime,
    todayStats.completedSessions,
    todayStats.sessionCount,
    todayStats.tabSwitches
  );

  await storageService.set('tracking_today', todayStats);

  // Record visit to recent visits
  const visits = await storageService.get<SiteVisit[]>('tracking_visits', []);
  const visit: SiteVisit = {
    id: generateId(),
    url,
    domain,
    title: title || domain,
    startTime: Date.now() - seconds * 1000,
    endTime: Date.now(),
    duration: seconds,
    isDistraction: isDistraction,
    category,
  };
  await storageService.set('tracking_visits', [visit, ...visits].slice(0, 200));
}

/**
 * Categorize a site as productive, distracting, or neutral.
 */
function categorizeSite(domain: string): SiteCategory {
  const lower = domain.toLowerCase();

  if (DEFAULT_DISTRACTING_DOMAINS.some((d) => lower === d || lower.endsWith(`.${d}`))) {
    return 'distracting';
  }

  if (DEFAULT_PRODUCTIVE_DOMAINS.some((d) => lower === d || lower.endsWith(`.${d}`))) {
    return 'productive';
  }

  return 'neutral';
}

/**
 * Get current daily stats, creating if needed.
 */
async function getCurrentDailyStats(): Promise<DailyStats> {
  const today = getTodayISO();
  const stats = await storageService.get<DailyStats>('tracking_today', {
    date: today,
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
  });

  // If the stored stats are from a different day, archive and reset
  if (stats.date !== today) {
    const weekly = await storageService.get<DailyStats[]>('tracking_weekly', []);
    await storageService.set('tracking_weekly', [...weekly, stats].slice(-30));

    const newStats: DailyStats = {
      date: today,
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
    await storageService.set('tracking_today', newStats);
    tabSwitchCount = 0;
    return newStats;
  }

  return stats;
}

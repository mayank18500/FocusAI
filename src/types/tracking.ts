// ============================================================
// FocusGuard AI — Productivity Tracking Types
// ============================================================

export interface SiteVisit {
  id: string;
  url: string;
  domain: string;
  title: string;
  startTime: number;       // Unix timestamp ms
  endTime: number | null;
  duration: number;         // in seconds
  isDistraction: boolean;
  category: SiteCategory;
}

export type SiteCategory = 'productive' | 'neutral' | 'distracting' | 'unknown';

export interface DailyStats {
  date: string;             // ISO date string (YYYY-MM-DD)
  focusTime: number;        // in seconds
  distractionTime: number;  // in seconds
  neutralTime: number;      // in seconds
  sessionCount: number;
  completedSessions: number;
  tabSwitches: number;
  sitesVisited: number;
  focusScore: number;       // 0–100
  topProductiveSites: SiteSummary[];
  topDistractingSites: SiteSummary[];
}

export interface SiteSummary {
  domain: string;
  totalTime: number;        // in seconds
  visits: number;
}

export interface WeeklyReport {
  weekStart: string;        // ISO date
  weekEnd: string;          // ISO date
  totalFocusTime: number;   // in seconds
  totalDistractionTime: number;
  dailyStats: DailyStats[];
  topProductiveSites: SiteSummary[];
  topDistractingSites: SiteSummary[];
  focusScore: number;       // 0–100
  streakDays: number;
  sessionsCompleted: number;
  sessionsTotal: number;
  completionRate: number;   // 0–100
  achievementsUnlocked: number;
  comparisonToPrevWeek: {
    focusTimeChange: number;    // percentage
    distractionTimeChange: number;
    focusScoreChange: number;
  };
  aiInsights: string[];
}

export interface HourlyProductivity {
  hour: number;             // 0–23
  focusTime: number;        // in seconds
  distractionTime: number;
  sessionCount: number;
}

export interface TrackingState {
  currentVisit: SiteVisit | null;
  todayStats: DailyStats;
  recentVisits: SiteVisit[];
  weeklyData: DailyStats[];
}

/** Domains that are known to be distracting */
export const DEFAULT_DISTRACTING_DOMAINS = [
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'tiktok.com',
  'threads.net',
  'snapchat.com',
  'pinterest.com',
  'twitch.tv',
  'discord.com',
  'netflix.com',
  'hulu.com',
  'disneyplus.com',
  'primevideo.com',
  '9gag.com',
  'buzzfeed.com',
  'tumblr.com',
];

/** Domains that are known to be productive */
export const DEFAULT_PRODUCTIVE_DOMAINS = [
  'github.com',
  'gitlab.com',
  'stackoverflow.com',
  'developer.mozilla.org',
  'docs.google.com',
  'notion.so',
  'linear.app',
  'figma.com',
  'coursera.org',
  'udemy.com',
  'leetcode.com',
  'codeforces.com',
  'hackerrank.com',
  'geeksforgeeks.org',
  'medium.com',
  'dev.to',
  'arxiv.org',
  'scholar.google.com',
  'wikipedia.org',
];

// ============================================================
// FocusGuard AI — Settings Types
// ============================================================

export interface Settings {
  // Blocking
  blockedSites: string[];
  customBlockedSites: string[];
  blockingEnabled: boolean;

  // Focus Sessions
  defaultSessionDuration: number;   // in minutes
  defaultBreakDuration: number;     // in minutes
  autoStartBreak: boolean;

  // Notifications
  notificationsEnabled: boolean;
  notificationFrequency: NotificationFrequency;
  soundEnabled: boolean;
  soundVolume: number;              // 0–100

  // Theme & UI
  theme: ThemeMode;
  focusOverlayEnabled: boolean;
  focusOverlayPosition: OverlayPosition;
  showMotivationalMessages: boolean;

  // Tab Management
  maxTabs: number;
  tabWarningEnabled: boolean;

  // AI
  geminiApiKey: string;
  aiCoachingEnabled: boolean;
  aiCoachingFrequency: AICoachingFrequency;
  intentCheckEnabled: boolean;

  // Data
  dataRetentionDays: number;        // days to keep tracking data

  // Daily Goals Defaults
  dailyFocusHoursTarget: number;
  dailyTasksTarget: number;
  dailySessionsTarget: number;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type NotificationFrequency = 'low' | 'medium' | 'high';
export type AICoachingFrequency = 'daily' | 'weekly' | 'on_demand';
export type OverlayPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export const DEFAULT_SETTINGS: Settings = {
  // Blocking
  blockedSites: [
    'youtube.com',
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'x.com',
    'reddit.com',
    'tiktok.com',
    'threads.net',
  ],
  customBlockedSites: [],
  blockingEnabled: true,

  // Focus Sessions
  defaultSessionDuration: 25,
  defaultBreakDuration: 5,
  autoStartBreak: false,

  // Notifications
  notificationsEnabled: true,
  notificationFrequency: 'medium',
  soundEnabled: true,
  soundVolume: 50,

  // Theme & UI
  theme: 'dark',
  focusOverlayEnabled: true,
  focusOverlayPosition: 'bottom-right',
  showMotivationalMessages: true,

  // Tab Management
  maxTabs: 15,
  tabWarningEnabled: true,

  // AI
  geminiApiKey: '',
  aiCoachingEnabled: true,
  aiCoachingFrequency: 'daily',
  intentCheckEnabled: true,

  // Data
  dataRetentionDays: 90,

  // Daily Goals
  dailyFocusHoursTarget: 4,
  dailyTasksTarget: 5,
  dailySessionsTarget: 4,
};

export const NOTIFICATION_FREQUENCY_LABELS: Record<NotificationFrequency, string> = {
  low: 'Low (important only)',
  medium: 'Medium (balanced)',
  high: 'High (all events)',
};

export const AI_COACHING_FREQUENCY_LABELS: Record<AICoachingFrequency, string> = {
  daily: 'Daily recommendations',
  weekly: 'Weekly summary only',
  on_demand: 'Only when I ask',
};

// ============================================================
// FocusGuard AI — Utility Functions
// ============================================================

// --- Constants ---

export const MOTIVATIONAL_MESSAGES = [
  "You're doing great! Keep the momentum going. 🚀",
  "Every focused minute counts. Stay on track! 💪",
  "Deep work is rare and valuable. You're building something amazing. ✨",
  "Distractions are the enemy of excellence. You've got this! 🎯",
  "One task at a time. That's the secret to greatness. 🌟",
  "Your future self will thank you for staying focused right now. 🙏",
  "Consistency beats intensity. Keep showing up! 🔥",
  "The best code is written with unbroken concentration. 💻",
  "You're stronger than the urge to scroll. Stay focused! 🛡️",
  "Small steps, every day. That's how legends are made. 🏆",
  "Focus is not about saying yes to one thing — it's about saying no to a hundred others. 🎯",
  "You don't need motivation. You need discipline. And you have it. 💎",
];

export const STORAGE_KEYS = {
  SESSION_CURRENT: 'session_current',
  SESSION_HISTORY: 'session_history',
  SETTINGS: 'settings',
  TRACKING_TODAY: 'tracking_today',
  TRACKING_VISITS: 'tracking_visits',
  TRACKING_WEEKLY: 'tracking_weekly',
  PET: 'pet',
  ACHIEVEMENTS: 'achievements',
  DAILY_GOALS: 'daily_goals',
  OVERRIDES: 'overrides',
  XP_EVENTS: 'xp_events',
} as const;

export const ALARM_NAMES = {
  SESSION_TIMER: 'fg_session_timer',
  TRACKING_AGGREGATE: 'fg_tracking_aggregate',
  DAILY_RESET: 'fg_daily_reset',
  WEEKLY_REPORT: 'fg_weekly_report',
  DISTRACTION_CHECK: 'fg_distraction_check',
  TAB_CHECK: 'fg_tab_check',
} as const;

export const SESSION_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '25 min', value: 25 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
  { label: '120 min', value: 120 },
];

export const MAX_TAB_OPTIONS = [5, 10, 15, 20, 25, 30];

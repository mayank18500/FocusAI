// ============================================================
// FocusGuard AI — Achievement System Types
// ============================================================

export type AchievementCategory = 'sessions' | 'streaks' | 'time' | 'special';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;              // Emoji icon
  category: AchievementCategory;
  requirement: number;       // Target value to unlock
  progress: number;          // Current progress
  unlocked: boolean;
  unlockedAt: number | null; // Unix timestamp
  tier: AchievementTier;
}

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export const ACHIEVEMENT_TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

/** Pre-defined achievements */
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  // Sessions
  {
    id: 'first_session',
    title: 'First Step',
    description: 'Complete your first focus session',
    icon: '🎯',
    category: 'sessions',
    requirement: 1,
    tier: 'bronze',
  },
  {
    id: 'sessions_10',
    title: 'Getting Started',
    description: 'Complete 10 focus sessions',
    icon: '🔥',
    category: 'sessions',
    requirement: 10,
    tier: 'bronze',
  },
  {
    id: 'sessions_50',
    title: 'Focused Mind',
    description: 'Complete 50 focus sessions',
    icon: '🧠',
    category: 'sessions',
    requirement: 50,
    tier: 'silver',
  },
  {
    id: 'sessions_100',
    title: 'Century Club',
    description: 'Complete 100 focus sessions',
    icon: '💯',
    category: 'sessions',
    requirement: 100,
    tier: 'gold',
  },
  {
    id: 'sessions_500',
    title: 'Focus Master',
    description: 'Complete 500 focus sessions',
    icon: '👑',
    category: 'sessions',
    requirement: 500,
    tier: 'platinum',
  },
  {
    id: 'sessions_1000',
    title: 'Legendary Focus',
    description: 'Complete 1000 focus sessions',
    icon: '⭐',
    category: 'sessions',
    requirement: 1000,
    tier: 'diamond',
  },

  // Streaks
  {
    id: 'streak_3',
    title: 'Three Peat',
    description: 'Maintain a 3-day focus streak',
    icon: '🔥',
    category: 'streaks',
    requirement: 3,
    tier: 'bronze',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day focus streak',
    icon: '⚡',
    category: 'streaks',
    requirement: 7,
    tier: 'silver',
  },
  {
    id: 'streak_14',
    title: 'Fortnight Force',
    description: 'Maintain a 14-day focus streak',
    icon: '🌟',
    category: 'streaks',
    requirement: 14,
    tier: 'gold',
  },
  {
    id: 'streak_30',
    title: 'Monthly Marvel',
    description: 'Maintain a 30-day focus streak',
    icon: '🏆',
    category: 'streaks',
    requirement: 30,
    tier: 'platinum',
  },
  {
    id: 'streak_100',
    title: 'Unstoppable',
    description: 'Maintain a 100-day focus streak',
    icon: '💎',
    category: 'streaks',
    requirement: 100,
    tier: 'diamond',
  },

  // Time
  {
    id: 'time_1h',
    title: 'Hour Power',
    description: 'Accumulate 1 hour of total focus time',
    icon: '⏰',
    category: 'time',
    requirement: 60,
    tier: 'bronze',
  },
  {
    id: 'time_5h',
    title: 'Half Day Hero',
    description: 'Accumulate 5 hours of total focus time',
    icon: '🕐',
    category: 'time',
    requirement: 300,
    tier: 'bronze',
  },
  {
    id: 'time_25h',
    title: 'Day Crusher',
    description: 'Accumulate 25 hours of total focus time',
    icon: '📅',
    category: 'time',
    requirement: 1500,
    tier: 'silver',
  },
  {
    id: 'time_100h',
    title: 'Centurion',
    description: 'Accumulate 100 hours of total focus time',
    icon: '🏛️',
    category: 'time',
    requirement: 6000,
    tier: 'gold',
  },
  {
    id: 'time_500h',
    title: 'Deep Work Master',
    description: 'Accumulate 500 hours of total focus time',
    icon: '🧘',
    category: 'time',
    requirement: 30000,
    tier: 'platinum',
  },

  // Special
  {
    id: 'no_distraction_session',
    title: 'Laser Focus',
    description: 'Complete a session with zero distractions',
    icon: '🎯',
    category: 'special',
    requirement: 1,
    tier: 'silver',
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Start a session before 7 AM',
    icon: '🌅',
    category: 'special',
    requirement: 1,
    tier: 'bronze',
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete a session after 11 PM',
    icon: '🦉',
    category: 'special',
    requirement: 1,
    tier: 'bronze',
  },
  {
    id: 'marathon_session',
    title: 'Marathon',
    description: 'Complete a focus session longer than 2 hours',
    icon: '🏃',
    category: 'special',
    requirement: 1,
    tier: 'gold',
  },
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Complete all daily goals for 7 consecutive days',
    icon: '🌈',
    category: 'special',
    requirement: 1,
    tier: 'platinum',
  },
  {
    id: 'galaxy_pet',
    title: 'Cosmic Guardian',
    description: 'Evolve your pet to Galaxy Tree stage',
    icon: '🌌',
    category: 'special',
    requirement: 1,
    tier: 'diamond',
  },
];

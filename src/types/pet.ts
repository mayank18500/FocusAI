// ============================================================
// FocusGuard AI — Focus Pet System Types
// ============================================================

export type PetStage = 'seed' | 'sprout' | 'plant' | 'tree' | 'forest' | 'galaxyTree';

export interface Pet {
  name: string;
  stage: PetStage;
  xp: number;
  level: number;
  streak: number;            // consecutive days with completed sessions
  bestStreak: number;
  lastFedDate: string | null; // ISO date string
  createdAt: number;         // Unix timestamp
  totalXpEarned: number;
  evolutionHistory: PetEvolution[];
}

export interface PetEvolution {
  fromStage: PetStage;
  toStage: PetStage;
  date: number;              // Unix timestamp
  xpAtEvolution: number;
}

export interface XPEvent {
  type: XPEventType;
  amount: number;
  timestamp: number;
  description: string;
}

export type XPEventType =
  | 'session_complete'
  | 'session_long'
  | 'no_distractions'
  | 'daily_streak'
  | 'weekly_streak'
  | 'achievement_unlock'
  | 'goal_complete'
  | 'perfect_day';

/** XP thresholds for each evolution stage */
export const PET_STAGE_THRESHOLDS: Record<PetStage, number> = {
  seed: 0,
  sprout: 100,
  plant: 500,
  tree: 1500,
  forest: 5000,
  galaxyTree: 15000,
};

/** Ordered pet stages for progression */
export const PET_STAGES_ORDER: PetStage[] = [
  'seed',
  'sprout',
  'plant',
  'tree',
  'forest',
  'galaxyTree',
];

/** Human-readable labels for each stage */
export const PET_STAGE_LABELS: Record<PetStage, string> = {
  seed: '🌱 Seed',
  sprout: '🌿 Sprout',
  plant: '🌻 Plant',
  tree: '🌳 Tree',
  forest: '🌲 Forest',
  galaxyTree: '🌌 Galaxy Tree',
};

/** CSS emoji representations for each pet stage */
export const PET_STAGE_EMOJI: Record<PetStage, string> = {
  seed: '🌱',
  sprout: '🌿',
  plant: '🌻',
  tree: '🌳',
  forest: '🌲🌳🌲',
  galaxyTree: '🌌🌳✨',
};

/** XP rewards for different event types */
export const XP_REWARDS: Record<XPEventType, number> = {
  session_complete: 25,
  session_long: 50,       // > 45 min sessions
  no_distractions: 15,    // Session with 0 distractions
  daily_streak: 30,
  weekly_streak: 100,
  achievement_unlock: 20,
  goal_complete: 40,
  perfect_day: 75,        // All daily goals met
};

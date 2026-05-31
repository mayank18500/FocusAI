// ============================================================
// FocusGuard AI — XP & Leveling Calculator
// ============================================================

import { PET_STAGES_ORDER, PET_STAGE_THRESHOLDS, XP_REWARDS } from '@/types/pet';
import type { PetStage, XPEventType } from '@/types/pet';

/**
 * Calculate XP reward for a given event type.
 */
export function calculateXP(eventType: XPEventType, multiplier: number = 1): number {
  return Math.floor(XP_REWARDS[eventType] * multiplier);
}

/**
 * Calculate XP for a completed session based on duration and bonus conditions.
 */
export function calculateSessionXP(
  durationMinutes: number,
  wasDistracted: boolean,
  streakDays: number
): number {
  let xp = calculateXP('session_complete');

  // Bonus for long sessions (> 45 min)
  if (durationMinutes >= 45) {
    xp += calculateXP('session_long');
  }

  // Bonus for no distractions
  if (!wasDistracted) {
    xp += calculateXP('no_distractions');
  }

  // Streak multiplier (5% per streak day, max 50%)
  const streakMultiplier = 1 + Math.min(streakDays * 0.05, 0.5);
  xp = Math.floor(xp * streakMultiplier);

  return xp;
}

/**
 * Determine the pet stage based on total XP.
 */
export function getStageForXP(xp: number): PetStage {
  let stage: PetStage = 'seed';
  for (const s of PET_STAGES_ORDER) {
    if (xp >= PET_STAGE_THRESHOLDS[s]) {
      stage = s;
    }
  }
  return stage;
}

/**
 * Get XP needed for the next stage.
 */
export function getXPForNextStage(currentXP: number): {
  nextStage: PetStage | null;
  xpNeeded: number;
  xpProgress: number;
  progressPercent: number;
} {
  const currentStage = getStageForXP(currentXP);
  const currentIndex = PET_STAGES_ORDER.indexOf(currentStage);

  if (currentIndex >= PET_STAGES_ORDER.length - 1) {
    return {
      nextStage: null,
      xpNeeded: 0,
      xpProgress: 0,
      progressPercent: 100,
    };
  }

  const nextStage = PET_STAGES_ORDER[currentIndex + 1];
  const currentThreshold = PET_STAGE_THRESHOLDS[currentStage];
  const nextThreshold = PET_STAGE_THRESHOLDS[nextStage];
  const xpProgress = currentXP - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progressPercent = Math.min(100, (xpProgress / xpNeeded) * 100);

  return { nextStage, xpNeeded, xpProgress, progressPercent };
}

/**
 * Calculate the level based on total XP.
 * Level = floor(sqrt(totalXP / 50)) + 1
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 50)) + 1;
}

/**
 * Get XP needed for the next level.
 */
export function getXPForNextLevel(totalXP: number): {
  currentLevel: number;
  nextLevelXP: number;
  progress: number;
  progressPercent: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelXP = Math.pow(currentLevel - 1, 2) * 50;
  const nextLevelXP = Math.pow(currentLevel, 2) * 50;
  const progress = totalXP - currentLevelXP;
  const needed = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, (progress / needed) * 100);

  return { currentLevel, nextLevelXP, progress, progressPercent };
}

/**
 * Calculate focus score (0–100) based on daily stats.
 */
export function calculateFocusScore(
  focusTime: number,
  distractionTime: number,
  sessionsCompleted: number,
  sessionsTotal: number,
  tabSwitches: number
): number {
  if (focusTime === 0 && distractionTime === 0) return 0;

  const totalTime = focusTime + distractionTime;
  const focusRatio = totalTime > 0 ? focusTime / totalTime : 0;
  const completionRate = sessionsTotal > 0 ? sessionsCompleted / sessionsTotal : 0;
  const tabPenalty = Math.min(tabSwitches / 100, 0.3); // Max 30% penalty

  // Weighted score
  const score = (focusRatio * 50 + completionRate * 35 + (1 - tabPenalty) * 15);
  return Math.round(Math.min(100, Math.max(0, score)));
}

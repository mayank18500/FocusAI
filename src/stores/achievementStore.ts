// ============================================================
// FocusGuard AI — Achievement Store
// ============================================================

import { create } from 'zustand';
import type { Achievement } from '@/types/achievements';
import { ACHIEVEMENT_DEFINITIONS } from '@/types/achievements';

function initializeAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    progress: 0,
    unlocked: false,
    unlockedAt: null,
  }));
}

interface AchievementState {
  achievements: Achievement[];
  recentUnlocks: Achievement[];

  // Actions
  updateProgress: (id: string, progress: number) => Achievement | null;
  checkAndUnlock: (id: string, currentValue: number) => Achievement | null;
  batchCheck: (checks: { id: string; value: number }[]) => Achievement[];
  getByCategory: (category: string) => Achievement[];
  hydrate: (state: Partial<AchievementState>) => void;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: initializeAchievements(),
  recentUnlocks: [],

  updateProgress: (id, progress) => {
    const { achievements } = get();
    const idx = achievements.findIndex((a) => a.id === id);
    if (idx < 0) return null;

    const achievement = achievements[idx];
    if (achievement.unlocked) return null;

    const updated = { ...achievement, progress: Math.min(progress, achievement.requirement) };
    const newList = [...achievements];
    newList[idx] = updated;
    set({ achievements: newList });
    return updated;
  },

  checkAndUnlock: (id, currentValue) => {
    const { achievements, recentUnlocks } = get();
    const idx = achievements.findIndex((a) => a.id === id);
    if (idx < 0) return null;

    const achievement = achievements[idx];
    if (achievement.unlocked) return null;

    const newProgress = Math.min(currentValue, achievement.requirement);
    const shouldUnlock = currentValue >= achievement.requirement;

    const updated: Achievement = {
      ...achievement,
      progress: newProgress,
      unlocked: shouldUnlock,
      unlockedAt: shouldUnlock ? Date.now() : null,
    };

    const newList = [...achievements];
    newList[idx] = updated;

    set({
      achievements: newList,
      recentUnlocks: shouldUnlock
        ? [updated, ...recentUnlocks].slice(0, 10)
        : recentUnlocks,
    });

    return shouldUnlock ? updated : null;
  },

  batchCheck: (checks) => {
    const unlocked: Achievement[] = [];
    for (const check of checks) {
      const result = get().checkAndUnlock(check.id, check.value);
      if (result) unlocked.push(result);
    }
    return unlocked;
  },

  getByCategory: (category) => {
    return get().achievements.filter((a) => a.category === category);
  },

  hydrate: (state) => {
    // Merge with definitions to pick up any new achievements
    if (state.achievements) {
      const existingMap = new Map(state.achievements.map((a) => [a.id, a]));
      const merged = ACHIEVEMENT_DEFINITIONS.map((def) => {
        const existing = existingMap.get(def.id);
        if (existing) {
          return { ...def, progress: existing.progress, unlocked: existing.unlocked, unlockedAt: existing.unlockedAt };
        }
        return { ...def, progress: 0, unlocked: false, unlockedAt: null };
      });
      set({ ...state, achievements: merged });
    } else {
      set(state);
    }
  },
}));

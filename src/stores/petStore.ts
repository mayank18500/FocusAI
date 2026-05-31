// ============================================================
// FocusGuard AI — Pet Store
// ============================================================

import { create } from 'zustand';
import type { Pet, PetEvolution, XPEvent, XPEventType } from '@/types/pet';
import { PET_STAGE_THRESHOLDS, PET_STAGES_ORDER } from '@/types/pet';
import { calculateLevel, getStageForXP } from '@/utils/xpCalculator';
import { getTodayISO } from '@/utils/timeUtils';

function createDefaultPet(): Pet {
  return {
    name: 'FocusBuddy',
    stage: 'seed',
    xp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    lastFedDate: null,
    createdAt: Date.now(),
    totalXpEarned: 0,
    evolutionHistory: [],
  };
}

interface PetState {
  pet: Pet;
  xpEvents: XPEvent[];

  // Actions
  addXP: (amount: number, eventType: XPEventType, description: string) => void;
  checkEvolution: () => boolean;
  updateStreak: () => void;
  renamePet: (name: string) => void;
  hydrate: (state: Partial<PetState>) => void;
}

export const usePetStore = create<PetState>((set, get) => ({
  pet: createDefaultPet(),
  xpEvents: [],

  addXP: (amount, eventType, description) => {
    const { pet, xpEvents } = get();
    const newXP = pet.xp + amount;
    const newLevel = calculateLevel(newXP);

    const event: XPEvent = {
      type: eventType,
      amount,
      timestamp: Date.now(),
      description,
    };

    set({
      pet: {
        ...pet,
        xp: newXP,
        totalXpEarned: pet.totalXpEarned + amount,
        level: newLevel,
        lastFedDate: getTodayISO(),
      },
      xpEvents: [event, ...xpEvents].slice(0, 100),
    });

    // Check for evolution after XP gain
    get().checkEvolution();
  },

  checkEvolution: () => {
    const { pet } = get();
    const newStage = getStageForXP(pet.xp);

    if (newStage !== pet.stage) {
      const currentIdx = PET_STAGES_ORDER.indexOf(pet.stage);
      const newIdx = PET_STAGES_ORDER.indexOf(newStage);

      if (newIdx > currentIdx) {
        const evolution: PetEvolution = {
          fromStage: pet.stage,
          toStage: newStage,
          date: Date.now(),
          xpAtEvolution: pet.xp,
        };

        set({
          pet: {
            ...pet,
            stage: newStage,
            evolutionHistory: [...pet.evolutionHistory, evolution],
          },
        });
        return true; // Evolution happened
      }
    }
    return false;
  },

  updateStreak: () => {
    const { pet } = get();
    const today = getTodayISO();

    if (pet.lastFedDate === today) return; // Already fed today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    let newStreak: number;
    if (pet.lastFedDate === yesterdayISO) {
      newStreak = pet.streak + 1;
    } else {
      newStreak = 1; // Streak broken
    }

    set({
      pet: {
        ...pet,
        streak: newStreak,
        bestStreak: Math.max(pet.bestStreak, newStreak),
        lastFedDate: today,
      },
    });
  },

  renamePet: (name) => {
    const { pet } = get();
    set({ pet: { ...pet, name: name.trim() || 'FocusBuddy' } });
  },

  hydrate: (state) => set(state),
}));

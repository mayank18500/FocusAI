// ============================================================
// FocusGuard AI — Settings Store
// ============================================================

import { create } from 'zustand';
import type { Settings, ThemeMode, NotificationFrequency, AICoachingFrequency, OverlayPosition } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { cleanApiKey } from '@/utils/validators';

interface SettingsState extends Settings {
  // Actions
  updateSettings: (updates: Partial<Settings>) => void;
  addBlockedSite: (domain: string) => void;
  removeBlockedSite: (domain: string) => void;
  addCustomBlockedSite: (domain: string) => void;
  removeCustomBlockedSite: (domain: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setNotificationFrequency: (freq: NotificationFrequency) => void;
  setAICoachingFrequency: (freq: AICoachingFrequency) => void;
  setOverlayPosition: (pos: OverlayPosition) => void;
  setGeminiApiKey: (key: string) => void;
  resetToDefaults: () => void;
  getSettings: () => Settings;
  hydrate: (state: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,

  updateSettings: (updates) => {
    if (updates.geminiApiKey !== undefined) {
      updates.geminiApiKey = cleanApiKey(updates.geminiApiKey);
    }
    set(updates);
  },

  addBlockedSite: (domain) => {
    const { blockedSites } = get();
    if (!blockedSites.includes(domain)) {
      set({ blockedSites: [...blockedSites, domain] });
    }
  },

  removeBlockedSite: (domain) => {
    set({ blockedSites: get().blockedSites.filter((s) => s !== domain) });
  },

  addCustomBlockedSite: (domain) => {
    const { customBlockedSites } = get();
    if (!customBlockedSites.includes(domain)) {
      set({ customBlockedSites: [...customBlockedSites, domain] });
    }
  },

  removeCustomBlockedSite: (domain) => {
    set({
      customBlockedSites: get().customBlockedSites.filter((s) => s !== domain),
    });
  },

  setTheme: (theme) => set({ theme }),
  setNotificationFrequency: (freq) => set({ notificationFrequency: freq }),
  setAICoachingFrequency: (freq) => set({ aiCoachingFrequency: freq }),
  setOverlayPosition: (pos) => set({ focusOverlayPosition: pos }),
  setGeminiApiKey: (key) => set({ geminiApiKey: cleanApiKey(key) }),

  resetToDefaults: () => set(DEFAULT_SETTINGS),

  getSettings: (): Settings => {
    const state = get();
    const { updateSettings, addBlockedSite, removeBlockedSite, addCustomBlockedSite, removeCustomBlockedSite, setTheme, setNotificationFrequency, setAICoachingFrequency, setOverlayPosition, setGeminiApiKey, resetToDefaults, getSettings, hydrate, ...settings } = state;
    return settings;
  },

  hydrate: (state) => set(state),
}));

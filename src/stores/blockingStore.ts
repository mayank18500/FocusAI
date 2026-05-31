// ============================================================
// FocusGuard AI — Blocking Store
// ============================================================

import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '@/types/settings';

interface OverrideEntry {
  domain: string;
  expiresAt: number; // Unix timestamp
}

interface BlockingState {
  blockedSites: string[];
  customBlockedSites: string[];
  blockingEnabled: boolean;
  activeOverrides: OverrideEntry[];

  // Actions
  addSite: (domain: string) => void;
  removeSite: (domain: string) => void;
  toggleBlocking: (enabled: boolean) => void;
  addOverride: (domain: string, durationMinutes: number) => void;
  removeExpiredOverrides: () => void;
  isOverridden: (domain: string) => boolean;
  getAllBlockedDomains: () => string[];
  hydrate: (state: Partial<BlockingState>) => void;
}

export const useBlockingStore = create<BlockingState>((set, get) => ({
  blockedSites: DEFAULT_SETTINGS.blockedSites,
  customBlockedSites: [],
  blockingEnabled: true,
  activeOverrides: [],

  addSite: (domain) => {
    const { customBlockedSites } = get();
    if (!customBlockedSites.includes(domain)) {
      set({ customBlockedSites: [...customBlockedSites, domain] });
    }
  },

  removeSite: (domain) => {
    const { customBlockedSites, blockedSites } = get();
    set({
      customBlockedSites: customBlockedSites.filter((s) => s !== domain),
      blockedSites: blockedSites.filter((s) => s !== domain),
    });
  },

  toggleBlocking: (enabled) => set({ blockingEnabled: enabled }),

  addOverride: (domain, durationMinutes) => {
    const { activeOverrides } = get();
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    set({
      activeOverrides: [
        ...activeOverrides.filter((o) => o.domain !== domain),
        { domain, expiresAt },
      ],
    });
  },

  removeExpiredOverrides: () => {
    const { activeOverrides } = get();
    const now = Date.now();
    set({
      activeOverrides: activeOverrides.filter((o) => o.expiresAt > now),
    });
  },

  isOverridden: (domain) => {
    const { activeOverrides } = get();
    const now = Date.now();
    return activeOverrides.some(
      (o) => o.domain === domain && o.expiresAt > now
    );
  },

  getAllBlockedDomains: () => {
    const { blockedSites, customBlockedSites } = get();
    return [...new Set([...blockedSites, ...customBlockedSites])];
  },

  hydrate: (state) => set(state),
}));

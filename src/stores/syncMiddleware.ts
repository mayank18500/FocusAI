// ============================================================
// FocusGuard AI — Zustand + chrome.storage Sync Middleware
// ============================================================

import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { storageService, type StorageKey } from '@/services/storageService';

type ChromeSyncOptions = {
  key: StorageKey;
  debounceMs?: number;
};

type ChromeSync = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  config: StateCreator<T, Mps, Mcs>,
  options: ChromeSyncOptions
) => StateCreator<T, Mps, Mcs>;

/**
 * Zustand middleware that syncs state with chrome.storage.local.
 * - Persists state changes (debounced).
 * - Listens for external changes (from other contexts) and updates the store.
 */
export const chromeSync: ChromeSync = (config, options) => (set, get, api) => {
  const { key, debounceMs = 300 } = options;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isExternalUpdate = false;

  // Wrap set to persist changes
  const syncedSet = ((...args: any[]) => {
    (set as any)(...args);

    if (isExternalUpdate) return;

    // Debounce storage writes
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const state = get();
      storageService.set(key, state).catch(console.error);
    }, debounceMs);
  }) as unknown as typeof set;

  // Listen for external changes
  if (typeof chrome !== 'undefined' && chrome.storage) {
    storageService.onChange(key, (newValue) => {
      if (newValue) {
        isExternalUpdate = true;
        (set as (state: unknown) => void)(newValue);
        isExternalUpdate = false;
      }
    });
  }

  return config(syncedSet, get, api);
};

/**
 * Initialize a Zustand store from chrome.storage.
 * Call this when the store is first created.
 */
export async function initializeFromStorage<T>(
  key: StorageKey,
  defaultState: T,
  setState: (state: Partial<T>) => void
): Promise<void> {
  try {
    const stored = await storageService.get<T>(key, defaultState);
    if (stored) {
      setState(stored);
    }
  } catch (error) {
    console.error(`[FocusGuard] Failed to init store from key: ${key}`, error);
  }
}

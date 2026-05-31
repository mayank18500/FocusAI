// ============================================================
// FocusGuard AI — Chrome Storage Service
// Typed wrappers for chrome.storage.local
// ============================================================

const STORAGE_PREFIX = 'fg_';

export type StorageKey =
  | 'session_current'
  | 'session_history'
  | 'settings'
  | 'tracking_today'
  | 'tracking_visits'
  | 'tracking_weekly'
  | 'pet'
  | 'achievements'
  | 'daily_goals'
  | 'overrides'
  | 'xp_events';

function prefixKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

export const storageService = {
  async get<T>(key: StorageKey, defaultValue: T): Promise<T> {
    try {
      const result = await chrome.storage.local.get(prefixKey(key));
      const value = result[prefixKey(key)];
      return value !== undefined ? (value as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async set<T>(key: StorageKey, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [prefixKey(key)]: value });
    } catch (error) {
      console.error(`[FocusGuard] Storage set error for ${key}:`, error);
    }
  },

  async remove(key: StorageKey): Promise<void> {
    try {
      await chrome.storage.local.remove(prefixKey(key));
    } catch (error) {
      console.error(`[FocusGuard] Storage remove error for ${key}:`, error);
    }
  },

  async getBatch<T extends Record<string, unknown>>(
    keys: { key: StorageKey; default: unknown }[]
  ): Promise<T> {
    try {
      const prefixedKeys = keys.map((k) => prefixKey(k.key));
      const result = await chrome.storage.local.get(prefixedKeys);
      const output: Record<string, unknown> = {};
      for (const k of keys) {
        const prefixed = prefixKey(k.key);
        output[k.key] = result[prefixed] !== undefined ? result[prefixed] : k.default;
      }
      return output as T;
    } catch {
      const output: Record<string, unknown> = {};
      for (const k of keys) {
        output[k.key] = k.default;
      }
      return output as T;
    }
  },

  async clear(): Promise<void> {
    try {
      const all = await chrome.storage.local.get(null);
      const fgKeys = Object.keys(all).filter((k) => k.startsWith(STORAGE_PREFIX));
      if (fgKeys.length > 0) {
        await chrome.storage.local.remove(fgKeys);
      }
    } catch (error) {
      console.error('[FocusGuard] Storage clear error:', error);
    }
  },

  /** Listen for changes to a specific key */
  onChange(
    key: StorageKey,
    callback: (newValue: unknown, oldValue: unknown) => void
  ): () => void {
    const prefixed = prefixKey(key);
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes[prefixed]) {
        callback(changes[prefixed].newValue, changes[prefixed].oldValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  },

  /** Listen for changes to any FocusGuard key */
  onAnyChange(
    callback: (key: StorageKey, newValue: unknown, oldValue: unknown) => void
  ): () => void {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== 'local') return;
      for (const [fullKey, change] of Object.entries(changes)) {
        if (fullKey.startsWith(STORAGE_PREFIX)) {
          const key = fullKey.slice(STORAGE_PREFIX.length) as StorageKey;
          callback(key, change.newValue, change.oldValue);
        }
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  },
};

// ============================================================
// FocusGuard AI — Chrome API Hook
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { sendMessage } from '@/services/messagingService';
import type { ExtensionMessage } from '@/types/messages';

/**
 * Safe check if Chrome APIs are available.
 */
export function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}

/**
 * Hook to send messages to the background service worker.
 */
export function useChromeMessage<TResponse>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (message: ExtensionMessage): Promise<TResponse | null> => {
    if (!isChromeExtension()) {
      setError('Not running as extension');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await sendMessage<TResponse>(message);
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { send, loading, error };
}

/**
 * Hook to listen for storage changes.
 */
export function useChromeStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isChromeExtension()) {
      setLoading(false);
      return;
    }

    // Initial load
    chrome.storage.local.get(`fg_${key}`, (result) => {
      const stored = result[`fg_${key}`];
      if (stored !== undefined) {
        setValue(stored as T);
      }
      setLoading(false);
    });

    // Listen for changes
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes[`fg_${key}`]) {
        setValue(changes[`fg_${key}`].newValue as T);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [key]);

  const update = useCallback(async (newValue: T) => {
    if (!isChromeExtension()) return;
    setValue(newValue);
    await chrome.storage.local.set({ [`fg_${key}`]: newValue });
  }, [key]);

  return { value, loading, update };
}

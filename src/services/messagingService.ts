// ============================================================
// FocusGuard AI — Typed Messaging Service
// Cross-context communication via chrome.runtime
// ============================================================

import type { ExtensionMessage } from '@/types/messages';

/**
 * Send a typed message to the background service worker.
 * Returns a typed response.
 */
export async function sendMessage<TResponse>(
  message: ExtensionMessage
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response: TResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Send a message to a specific tab's content script.
 */
export async function sendTabMessage<TResponse>(
  tabId: number,
  message: ExtensionMessage
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.sendMessage(tabId, message, (response: TResponse) => {
        if (chrome.runtime.lastError) {
          // Content script may not be loaded — fail silently
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Register a message handler in the background service worker.
 * Supports async handlers via `return true` pattern.
 */
export function onMessage(
  handler: (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender
  ) => Promise<unknown> | unknown
): () => void {
  const listener = (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): boolean => {
    const result = handler(message, sender);

    if (result instanceof Promise) {
      result
        .then((response) => sendResponse(response))
        .catch((error) => {
          console.error('[FocusGuard] Message handler error:', error);
          sendResponse({ error: error.message });
        });
      return true; // Keep channel open for async response
    }

    sendResponse(result);
    return false;
  };

  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}

/**
 * Broadcast a message to all tabs' content scripts.
 */
export async function broadcastToTabs(message: ExtensionMessage): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch {
          // Content script not loaded on this tab — skip
        }
      }
    }
  } catch (error) {
    console.error('[FocusGuard] Broadcast error:', error);
  }
}

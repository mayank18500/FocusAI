// ============================================================
// FocusGuard AI — Tab Manager (Background)
// ============================================================

import { storageService } from '@/services/storageService';
import { DEFAULT_SETTINGS } from '@/types/settings';

interface TabInfo {
  totalTabs: number;
  maxTabs: number;
  duplicateTabs: { url: string; count: number; tabIds: number[] }[];
  inactiveTabs: { tabId: number; url: string; title: string; lastActive: number }[];
}

/**
 * Get information about current tabs.
 */
export async function getTabInfo(): Promise<TabInfo> {
  const settings = await storageService.get('settings', DEFAULT_SETTINGS);
  const tabs = await chrome.tabs.query({});

  // Find duplicate tabs
  const urlMap = new Map<string, number[]>();
  for (const tab of tabs) {
    if (tab.id && tab.url) {
      const existing = urlMap.get(tab.url) || [];
      existing.push(tab.id);
      urlMap.set(tab.url, existing);
    }
  }

  const duplicateTabs = Array.from(urlMap.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([url, ids]) => ({ url, count: ids.length, tabIds: ids }));

  // Find inactive tabs (no activity for 30+ minutes)
  // Since we can't track actual activity, we'll use tab index as a proxy
  const inactiveTabs = tabs
    .filter((tab) => !tab.active && tab.id && tab.url)
    .map((tab) => ({
      tabId: tab.id!,
      url: tab.url || '',
      title: tab.title || 'Untitled',
      lastActive: tab.lastAccessed || Date.now(),
    }))
    .filter((t) => Date.now() - t.lastActive > 30 * 60 * 1000)
    .sort((a, b) => a.lastActive - b.lastActive);

  return {
    totalTabs: tabs.length,
    maxTabs: settings.maxTabs,
    duplicateTabs,
    inactiveTabs,
  };
}

/**
 * Close specified tabs.
 */
export async function closeTabs(tabIds: number[]): Promise<{ success: boolean; closedCount: number }> {
  try {
    await chrome.tabs.remove(tabIds);
    return { success: true, closedCount: tabIds.length };
  } catch (error) {
    console.error('[FocusGuard] Error closing tabs:', error);
    return { success: false, closedCount: 0 };
  }
}

/**
 * Check tab count and notify if exceeded.
 */
export async function checkTabCount(maxTabs: number): Promise<void> {
  const tabs = await chrome.tabs.query({});
  if (tabs.length > maxTabs) {
    chrome.notifications.create('fg_tab_limit', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: '📑 Tab Limit Exceeded',
      message: `You currently have ${tabs.length} tabs open (limit: ${maxTabs}). Consider closing unused tabs to improve focus.`,
      buttons: [
        { title: '🗑️ Review Tabs' },
      ],
    });
  }
}

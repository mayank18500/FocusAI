// ============================================================
// FocusGuard AI — Background Service Worker Entry
// ============================================================

import { storageService } from '@/services/storageService';
import { handleMessage } from './messageRouter';
import { initializeTracking, cleanupTracking, handleTabChange } from './trackingEngine';
import { setupAlarms, handleAlarm } from './alarmHandlers';
import { checkTabCount } from './tabManager';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { handleNavigation } from './blockingEngine';

console.log('[FocusGuard] Service worker starting...');

// ------ Install Handler ------
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[FocusGuard] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Initialize default settings
    await storageService.set('settings', DEFAULT_SETTINGS);

    // Initialize empty session state
    await storageService.set('session_current', null);
    await storageService.set('session_history', []);

    // Open options page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/options/index.html'),
    });
  }

  // Setup alarms
  setupAlarms();
});

// ------ Startup Handler ------
chrome.runtime.onStartup.addListener(() => {
  console.log('[FocusGuard] Browser startup');
  setupAlarms();
  initializeTracking();
});

// ------ Message Handler ------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error('[FocusGuard] Message handler error:', error);
      sendResponse({ error: error.message });
    });
  return true; // Keep channel open for async
});

// ------ Tab Events ------
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      handleTabChange(tab.url, tab.title || '');
    }
  } catch (error) {
    // Tab may have been closed
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    handleNavigation(tabId, tab.url);
  }
});

chrome.tabs.onCreated.addListener(async () => {
  const settings = await storageService.get('settings', DEFAULT_SETTINGS);
  if (settings.tabWarningEnabled) {
    checkTabCount(settings.maxTabs);
  }
});

chrome.tabs.onRemoved.addListener(() => {
  // Cleanup tracking if needed
});

// ------ Web Navigation ------
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only main frame
  handleNavigation(details.tabId, details.url);
});

// ------ Alarm Handler ------
chrome.alarms.onAlarm.addListener(async (alarm) => {
  handleAlarm(alarm);
});

// ------ Notification Click Handler ------
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('fg_')) {
    // Open popup or dashboard
    chrome.action.openPopup?.();
  }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId === 'fg_distraction_alert' && buttonIndex === 0) {
    // "Start Focus Sprint" button
    chrome.runtime.sendMessage({
      type: 'START_SESSION',
      payload: {
        taskName: 'Focus Sprint',
        duration: 25,
        priority: 'medium',
        category: 'other',
      },
    });
  }
});

// Initialize tracking on load
initializeTracking();
console.log('[FocusGuard] Service worker initialized');

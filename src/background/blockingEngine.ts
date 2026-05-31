// ============================================================
// FocusGuard AI — Blocking Engine (Background)
// ============================================================

import { storageService } from '@/services/storageService';
import { isBlocked, extractDomain, isChromeInternal } from '@/utils/urlMatcher';
import { DEFAULT_SETTINGS } from '@/types/settings';
import type { FocusSession } from '@/types/session';
import { sendTabMessage } from '@/services/messagingService';

/**
 * Handle navigation events — check if URL should be blocked.
 */
export async function handleNavigation(tabId: number, url: string): Promise<void> {
  if (isChromeInternal(url)) return;

  const session = await storageService.get<FocusSession | null>('session_current', null);
  if (!session || session.status !== 'active') return;

  const settings = await storageService.get('settings', DEFAULT_SETTINGS);
  if (!settings.blockingEnabled) return;

  const allBlocked = [...settings.blockedSites, ...settings.customBlockedSites];
  const domain = extractDomain(url);

  if (!isBlocked(url, allBlocked)) {
    // Check if intent modal should be shown for potentially distracting sites
    if (settings.intentCheckEnabled && shouldShowIntentCheck(domain)) {
      try {
        await sendTabMessage(tabId, {
          type: 'SHOW_INTENT_MODAL',
          payload: {
            url,
            domain,
            taskName: session.taskName,
            timeRemaining: calculateTimeRemaining(session),
          },
        });
      } catch {
        // Content script not loaded yet
      }
    }
    return;
  }

  // Check for active override
  const overrides = await storageService.get<Record<string, number>>('overrides', {});
  if (overrides[domain] && overrides[domain] > Date.now()) {
    return; // Override still active
  }

  // URL is blocked — inject block page
  const timeRemaining = calculateTimeRemaining(session);

  try {
    await sendTabMessage(tabId, {
      type: 'SHOW_BLOCK_PAGE',
      payload: {
        taskName: session.taskName,
        timeRemaining,
        blockedUrl: url,
      },
    });
  } catch {
    // Content script not loaded — try injecting via scripting API
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: showBasicBlockPage,
        args: [session.taskName, timeRemaining],
      });
    } catch {
      // Tab may be unreachable
    }
  }
}

/**
 * Check if a domain should trigger the intent check modal.
 * This covers known distracting domains that aren't explicitly blocked.
 */
function shouldShowIntentCheck(domain: string): boolean {
  const intentCheckDomains = [
    'youtube.com',
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'x.com',
    'reddit.com',
    'tiktok.com',
    'threads.net',
    'netflix.com',
    'twitch.tv',
    'discord.com',
    'pinterest.com',
    'snapchat.com',
    '9gag.com',
    'buzzfeed.com',
  ];
  return intentCheckDomains.some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  );
}

function calculateTimeRemaining(session: FocusSession): number {
  if (session.status !== 'active') return 0;
  const elapsed = Date.now() - session.startTime - session.totalPausedTime;
  return Math.max(0, session.duration * 60 - Math.floor(elapsed / 1000));
}

/**
 * Fallback block page injected via scripting API when content script isn't available.
 */
function showBasicBlockPage(taskName: string, timeRemaining: number) {
  if (typeof document === 'undefined') return;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  document.documentElement.innerHTML = `
    <html>
    <head><title>FocusGuard AI — Stay Focused</title></head>
    <body style="
      margin: 0; padding: 0;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
      font-family: 'Inter', system-ui, sans-serif;
      color: #fafafa;
    ">
      <div style="text-align: center; max-width: 500px; padding: 40px;">
        <div style="font-size: 64px; margin-bottom: 20px;">🛡️</div>
        <h1 style="font-size: 28px; margin-bottom: 12px; background: linear-gradient(135deg, #7c3aed, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          Stay Focused
        </h1>
        <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 24px;">
          You are currently in a focus session.
        </p>
        <div style="
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.3);
          border-radius: 12px; padding: 20px; margin-bottom: 24px;
        ">
          <p style="color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Current Goal</p>
          <p style="font-size: 20px; font-weight: 600; margin: 8px 0;">${taskName}</p>
          <p style="color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 16px;">Time Remaining</p>
          <p style="font-size: 32px; font-weight: 700; font-family: monospace; color: #7c3aed;">
            ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
          </p>
        </div>
        <button onclick="history.back()" style="
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: white; border: none; padding: 12px 32px;
          border-radius: 8px; font-size: 16px; cursor: pointer;
          font-weight: 600;
        ">← Return to Work</button>
      </div>
    </body>
    </html>
  `;
}

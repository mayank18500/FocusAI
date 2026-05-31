// ============================================================
// FocusGuard AI — Content Script Entry
// ============================================================

import type { ExtensionMessage } from '@/types/messages';

let blockPageContainer: HTMLDivElement | null = null;
let intentModalContainer: HTMLDivElement | null = null;
let focusOverlayContainer: HTMLDivElement | null = null;
let overlayInterval: ReturnType<typeof setInterval> | null = null;

// Listen for messages from the background service worker
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'SHOW_BLOCK_PAGE':
        showBlockPage(
          message.payload.taskName,
          message.payload.timeRemaining,
          message.payload.blockedUrl
        );
        sendResponse({ success: true });
        break;

      case 'SHOW_INTENT_MODAL':
        showIntentModal(
          message.payload.url,
          message.payload.domain,
          message.payload.taskName,
          message.payload.timeRemaining
        );
        sendResponse({ success: true });
        break;

      case 'SHOW_FOCUS_OVERLAY':
        showFocusOverlay(
          message.payload.taskName,
          message.payload.timeRemaining,
          message.payload.totalDuration
        );
        sendResponse({ success: true });
        break;

      case 'HIDE_FOCUS_OVERLAY':
        hideFocusOverlay();
        sendResponse({ success: true });
        break;
    }
    return false;
  }
);

// ============================================
// Block Page
// ============================================
function showBlockPage(taskName: string, timeRemaining: number, _blockedUrl: string) {
  if (blockPageContainer) {
    blockPageContainer.remove();
  }

  blockPageContainer = document.createElement('div');
  blockPageContainer.id = 'focusguard-block-page';

  const shadow = blockPageContainer.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = getBlockPageStyles();
  shadow.appendChild(style);

  const wrapper = document.createElement('div');
  wrapper.className = 'fg-block-overlay';
  wrapper.innerHTML = createBlockPageHTML(taskName, timeRemaining);
  shadow.appendChild(wrapper);

  document.documentElement.appendChild(blockPageContainer);

  // Start countdown
  let remaining = timeRemaining;
  const timerEl = shadow.querySelector('.fg-timer') as HTMLElement;
  const interval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(interval);
      blockPageContainer?.remove();
      blockPageContainer = null;
      return;
    }
    if (timerEl) {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }, 1000);

  // Button handlers
  shadow.querySelector('.fg-btn-back')?.addEventListener('click', () => {
    clearInterval(interval);
    blockPageContainer?.remove();
    blockPageContainer = null;
    history.back();
  });

  shadow.querySelector('.fg-btn-override')?.addEventListener('click', () => {
    clearInterval(interval);
    chrome.runtime.sendMessage({
      type: 'OVERRIDE_BLOCK',
      payload: { url: location.hostname, duration: 5 },
    });
    blockPageContainer?.remove();
    blockPageContainer = null;
  });

  shadow.querySelector('.fg-btn-end')?.addEventListener('click', () => {
    clearInterval(interval);
    chrome.runtime.sendMessage({
      type: 'GET_SESSION',
    }, (response: any) => {
      if (response?.session?.id) {
        chrome.runtime.sendMessage({
          type: 'END_SESSION',
          payload: { sessionId: response.session.id, reason: 'manual' },
        });
      }
    });
    blockPageContainer?.remove();
    blockPageContainer = null;
  });
}

function createBlockPageHTML(taskName: string, timeRemaining: number): string {
  const m = Math.floor(timeRemaining / 60);
  const s = timeRemaining % 60;
  return `
    <div class="fg-block-content">
      <div class="fg-shield">🛡️</div>
      <h1 class="fg-title">Stay Focused</h1>
      <p class="fg-subtitle">You are currently in a focus session.</p>
      
      <div class="fg-info-card">
        <div class="fg-info-row">
          <span class="fg-label">Current Goal</span>
          <span class="fg-value">${escapeHtml(taskName)}</span>
        </div>
        <div class="fg-divider"></div>
        <div class="fg-info-row">
          <span class="fg-label">Time Remaining</span>
          <span class="fg-timer">${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}</span>
        </div>
      </div>

      <div class="fg-actions">
        <button class="fg-btn fg-btn-back">← Return to Work</button>
        <button class="fg-btn fg-btn-override fg-btn-secondary">Override for 5 min</button>
        <button class="fg-btn fg-btn-end fg-btn-ghost">End Session</button>
      </div>
    </div>
  `;
}

// ============================================
// Intent Modal
// ============================================
function showIntentModal(url: string, domain: string, taskName?: string, timeRemaining?: number) {
  if (intentModalContainer) {
    intentModalContainer.remove();
  }

  intentModalContainer = document.createElement('div');
  intentModalContainer.id = 'focusguard-intent-modal';

  const shadow = intentModalContainer.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = getIntentModalStyles();
  shadow.appendChild(style);

  const wrapper = document.createElement('div');
  wrapper.className = 'fg-modal-overlay';
  wrapper.innerHTML = createIntentModalHTML(domain);
  shadow.appendChild(wrapper);

  document.documentElement.appendChild(intentModalContainer);

  // Handle reason selection
  const reasons = shadow.querySelectorAll('.fg-reason-btn');
  reasons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const reason = (btn as HTMLElement).dataset.reason!;
      const responseArea = shadow.querySelector('.fg-ai-response') as HTMLElement;
      const loadingArea = shadow.querySelector('.fg-loading') as HTMLElement;
      const reasonsArea = shadow.querySelector('.fg-reasons') as HTMLElement;

      reasonsArea.style.display = 'none';
      loadingArea.style.display = 'flex';

      try {
        const response = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage(
            {
              type: 'CHECK_INTENT',
              payload: { url, domain, reason, currentTask: taskName, timeRemaining },
            },
            resolve
          );
        });

        loadingArea.style.display = 'none';
        responseArea.style.display = 'block';

        const classIcon = response.classification === 'productive' ? '✅' :
          response.classification === 'distracting' ? '⚠️' : 'ℹ️';

        responseArea.innerHTML = `
          <div class="fg-classification fg-classification-${response.classification}">
            ${classIcon} ${response.classification.charAt(0).toUpperCase() + response.classification.slice(1)}
          </div>
          <p class="fg-ai-message">${escapeHtml(response.message)}</p>
          <div class="fg-modal-actions">
            <button class="fg-btn fg-btn-continue">Continue to Site</button>
            <button class="fg-btn fg-btn-back fg-btn-primary">Go Back</button>
          </div>
        `;

        responseArea.querySelector('.fg-btn-continue')?.addEventListener('click', () => {
          intentModalContainer?.remove();
          intentModalContainer = null;
        });

        responseArea.querySelector('.fg-btn-back')?.addEventListener('click', () => {
          intentModalContainer?.remove();
          intentModalContainer = null;
          history.back();
        });
      } catch {
        loadingArea.style.display = 'none';
        reasonsArea.style.display = 'block';
      }
    });
  });

  // Close button
  shadow.querySelector('.fg-modal-close')?.addEventListener('click', () => {
    intentModalContainer?.remove();
    intentModalContainer = null;
  });
}

function createIntentModalHTML(domain: string): string {
  return `
    <div class="fg-modal-card">
      <button class="fg-modal-close">✕</button>
      <div class="fg-modal-icon">🤔</div>
      <h2 class="fg-modal-title">Why are you visiting this website?</h2>
      <p class="fg-modal-domain">${escapeHtml(domain)}</p>
      
      <div class="fg-reasons">
        <button class="fg-reason-btn" data-reason="work">💼 Work</button>
        <button class="fg-reason-btn" data-reason="research">🔍 Research</button>
        <button class="fg-reason-btn" data-reason="learning">📚 Learning</button>
        <button class="fg-reason-btn" data-reason="entertainment">🎮 Entertainment</button>
        <button class="fg-reason-btn" data-reason="not_sure">🤷 Not Sure</button>
      </div>
      
      <div class="fg-loading" style="display:none;">
        <div class="fg-spinner"></div>
        <p>Analyzing your intent...</p>
      </div>
      
      <div class="fg-ai-response" style="display:none;"></div>
    </div>
  `;
}

// ============================================
// Focus Overlay
// ============================================
function showFocusOverlay(taskName: string, timeRemaining: number, totalDuration: number) {
  hideFocusOverlay();

  focusOverlayContainer = document.createElement('div');
  focusOverlayContainer.id = 'focusguard-overlay';

  const shadow = focusOverlayContainer.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = getFocusOverlayStyles();
  shadow.appendChild(style);

  const wrapper = document.createElement('div');
  wrapper.className = 'fg-overlay-widget';
  shadow.appendChild(wrapper);

  document.documentElement.appendChild(focusOverlayContainer);

  let remaining = timeRemaining;
  const updateOverlay = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const progress = Math.max(0, ((totalDuration - remaining) / totalDuration) * 100);

    wrapper.innerHTML = `
      <div class="fg-overlay-header">
        <span class="fg-overlay-icon">🎯</span>
        <span class="fg-overlay-task">${escapeHtml(taskName.slice(0, 25))}</span>
        <button class="fg-overlay-minimize">−</button>
      </div>
      <div class="fg-overlay-timer">${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}</div>
      <div class="fg-overlay-progress-bg">
        <div class="fg-overlay-progress-fill" style="width: ${progress}%"></div>
      </div>
    `;

    wrapper.querySelector('.fg-overlay-minimize')?.addEventListener('click', () => {
      wrapper.classList.toggle('fg-minimized');
    });
  };

  updateOverlay();

  overlayInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      hideFocusOverlay();
      return;
    }
    updateOverlay();
  }, 1000);
}

function hideFocusOverlay() {
  if (overlayInterval) {
    clearInterval(overlayInterval);
    overlayInterval = null;
  }
  if (focusOverlayContainer) {
    focusOverlayContainer.remove();
    focusOverlayContainer = null;
  }
}

// ============================================
// Helpers
// ============================================
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================
// Styles
// ============================================
function getBlockPageStyles(): string {
  return `
    .fg-block-overlay {
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #fafafa;
      animation: fadeIn 0.3s ease-out;
    }
    .fg-block-content { text-align: center; max-width: 480px; padding: 40px; }
    .fg-shield { font-size: 72px; margin-bottom: 16px; animation: float 3s ease-in-out infinite; }
    .fg-title {
      font-size: 32px; font-weight: 700; margin: 0 0 8px;
      background: linear-gradient(135deg, #7c3aed, #6366f1, #2563eb);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .fg-subtitle { color: #a1a1aa; font-size: 16px; margin: 0 0 32px; }
    .fg-info-card {
      background: rgba(124, 58, 237, 0.08); border: 1px solid rgba(124, 58, 237, 0.2);
      border-radius: 16px; padding: 24px; margin-bottom: 32px;
    }
    .fg-info-row { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 0; }
    .fg-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #a1a1aa; }
    .fg-value { font-size: 20px; font-weight: 600; }
    .fg-timer { font-size: 40px; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #7c3aed; }
    .fg-divider { height: 1px; background: rgba(124, 58, 237, 0.15); margin: 12px 0; }
    .fg-actions { display: flex; flex-direction: column; gap: 10px; }
    .fg-btn {
      padding: 12px 28px; border-radius: 10px; font-size: 15px; font-weight: 600;
      cursor: pointer; border: none; transition: all 0.2s ease; font-family: inherit;
    }
    .fg-btn-back {
      background: linear-gradient(135deg, #7c3aed, #6366f1); color: white;
    }
    .fg-btn-back:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4); }
    .fg-btn-secondary {
      background: rgba(124, 58, 237, 0.1); color: #a78bfa;
      border: 1px solid rgba(124, 58, 237, 0.3);
    }
    .fg-btn-secondary:hover { background: rgba(124, 58, 237, 0.2); }
    .fg-btn-ghost { background: transparent; color: #6b7280; }
    .fg-btn-ghost:hover { color: #ef4444; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  `;
}

function getIntentModalStyles(): string {
  return `
    .fg-modal-overlay {
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      animation: fadeIn 0.2s ease-out;
    }
    .fg-modal-card {
      background: linear-gradient(135deg, #12121a, #1e1e2e);
      border: 1px solid rgba(124, 58, 237, 0.2);
      border-radius: 20px; padding: 36px; max-width: 420px; width: 90%;
      position: relative; color: #fafafa;
      animation: scaleIn 0.3s ease-out;
    }
    .fg-modal-close {
      position: absolute; top: 16px; right: 16px;
      background: none; border: none; color: #6b7280;
      font-size: 18px; cursor: pointer; padding: 4px 8px;
    }
    .fg-modal-close:hover { color: #fafafa; }
    .fg-modal-icon { font-size: 48px; text-align: center; margin-bottom: 16px; }
    .fg-modal-title { font-size: 20px; font-weight: 700; text-align: center; margin: 0 0 6px; }
    .fg-modal-domain { text-align: center; color: #a1a1aa; font-size: 14px; margin: 0 0 24px; }
    .fg-reasons { display: flex; flex-direction: column; gap: 8px; }
    .fg-reason-btn {
      padding: 12px 20px; border-radius: 10px;
      background: rgba(124, 58, 237, 0.08); border: 1px solid rgba(124, 58, 237, 0.15);
      color: #fafafa; font-size: 15px; cursor: pointer;
      transition: all 0.2s ease; text-align: left; font-family: inherit;
    }
    .fg-reason-btn:hover {
      background: rgba(124, 58, 237, 0.15);
      border-color: rgba(124, 58, 237, 0.4);
      transform: translateX(4px);
    }
    .fg-loading {
      display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px;
    }
    .fg-spinner {
      width: 32px; height: 32px; border: 3px solid rgba(124, 58, 237, 0.2);
      border-top-color: #7c3aed; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .fg-loading p { color: #a1a1aa; font-size: 14px; }
    .fg-ai-response { animation: fadeIn 0.3s ease-out; }
    .fg-classification {
      display: inline-block; padding: 6px 16px; border-radius: 20px;
      font-size: 14px; font-weight: 600; margin-bottom: 12px;
    }
    .fg-classification-productive { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .fg-classification-distracting { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .fg-classification-neutral { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .fg-ai-message { color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px; }
    .fg-modal-actions { display: flex; gap: 10px; }
    .fg-btn {
      flex: 1; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;
      cursor: pointer; border: none; transition: all 0.2s ease; font-family: inherit;
    }
    .fg-btn-continue {
      background: rgba(100, 100, 100, 0.2); color: #a1a1aa;
      border: 1px solid rgba(100, 100, 100, 0.3);
    }
    .fg-btn-continue:hover { background: rgba(100, 100, 100, 0.3); }
    .fg-btn-primary {
      background: linear-gradient(135deg, #7c3aed, #6366f1); color: white;
    }
    .fg-btn-primary:hover { box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
}

function getFocusOverlayStyles(): string {
  return `
    .fg-overlay-widget {
      position: fixed; bottom: 20px; right: 20px; z-index: 2147483646;
      background: linear-gradient(135deg, rgba(12, 12, 20, 0.95), rgba(24, 24, 42, 0.95));
      backdrop-filter: blur(20px);
      border: 1px solid rgba(124, 58, 237, 0.25);
      border-radius: 16px; padding: 14px 18px; min-width: 200px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #fafafa;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(124, 58, 237, 0.1);
      animation: slideUp 0.3s ease-out;
      transition: all 0.3s ease;
      cursor: default;
    }
    .fg-overlay-widget.fg-minimized {
      min-width: auto; padding: 8px 14px;
    }
    .fg-overlay-widget.fg-minimized .fg-overlay-timer,
    .fg-overlay-widget.fg-minimized .fg-overlay-progress-bg { display: none; }
    .fg-overlay-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .fg-minimized .fg-overlay-header { margin-bottom: 0; }
    .fg-overlay-icon { font-size: 16px; }
    .fg-overlay-task {
      font-size: 12px; font-weight: 600; color: #d1d5db; flex: 1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .fg-overlay-minimize {
      background: none; border: none; color: #6b7280; cursor: pointer;
      font-size: 16px; padding: 0 4px; line-height: 1;
    }
    .fg-overlay-minimize:hover { color: #fafafa; }
    .fg-overlay-timer {
      font-size: 24px; font-weight: 700; text-align: center;
      font-family: 'JetBrains Mono', monospace;
      background: linear-gradient(135deg, #7c3aed, #a78bfa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .fg-overlay-progress-bg {
      height: 3px; background: rgba(124, 58, 237, 0.2); border-radius: 2px; overflow: hidden;
    }
    .fg-overlay-progress-fill {
      height: 100%; background: linear-gradient(90deg, #7c3aed, #a78bfa);
      border-radius: 2px; transition: width 1s linear;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
}

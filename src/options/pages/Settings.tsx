import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';
import { validateApiKey, validateBlockedDomain } from '@/utils/validators';
import { SESSION_DURATIONS, MAX_TAB_OPTIONS } from '@/utils/constants';
import type { Settings as SettingsType } from '@/types/settings';
import { DEFAULT_SETTINGS, NOTIFICATION_FREQUENCY_LABELS, AI_COACHING_FREQUENCY_LABELS } from '@/types/settings';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    if (!isChromeExtension()) { setLoading(false); return; }
    try {
      const res = await sendMessage<any>({ type: 'GET_SETTINGS' });
      if (res?.settings) setSettings(res.settings);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateSetting = async (updates: Partial<SettingsType>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    await sendMessage({ type: 'UPDATE_SETTINGS', payload: updates });
    showSaved();
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetAll = async () => {
    if (confirm('Are you sure? This will reset all settings to defaults.')) {
      await sendMessage({ type: 'UPDATE_SETTINGS', payload: DEFAULT_SETTINGS });
      setSettings(DEFAULT_SETTINGS);
      showSaved();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize your FocusGuard experience</p>
        </div>
        {saved && (
          <span className="text-xs text-success bg-success/15 px-3 py-1.5 rounded-lg animate-[fade-in_0.2s_ease-out]">
            ✓ Saved
          </span>
        )}
      </div>

      {/* Focus Sessions */}
      <Section title="🎯 Focus Sessions">
        <SettingRow label="Default Duration">
          <select
            value={settings.defaultSessionDuration}
            onChange={(e) => updateSetting({ defaultSessionDuration: parseInt(e.target.value) })}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary"
          >
            {SESSION_DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="Break Duration">
          <select
            value={settings.defaultBreakDuration}
            onChange={(e) => updateSetting({ defaultBreakDuration: parseInt(e.target.value) })}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary"
          >
            {[5, 10, 15, 20].map((d) => (
              <option key={d} value={d}>{d} min</option>
            ))}
          </select>
        </SettingRow>
      </Section>

      {/* Blocking */}
      <Section title="🚫 Website Blocking">
        <SettingRow label="Enable Blocking">
          <Toggle checked={settings.blockingEnabled} onChange={(v) => updateSetting({ blockingEnabled: v })} />
        </SettingRow>
      </Section>

      {/* Notifications */}
      <Section title="🔔 Notifications">
        <SettingRow label="Enable Notifications">
          <Toggle checked={settings.notificationsEnabled} onChange={(v) => updateSetting({ notificationsEnabled: v })} />
        </SettingRow>
        <SettingRow label="Frequency">
          <select
            value={settings.notificationFrequency}
            onChange={(e) => updateSetting({ notificationFrequency: e.target.value as any })}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary"
          >
            {Object.entries(NOTIFICATION_FREQUENCY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="Sound Effects">
          <Toggle checked={settings.soundEnabled} onChange={(v) => updateSetting({ soundEnabled: v })} />
        </SettingRow>
      </Section>

      {/* Tab Management */}
      <Section title="📑 Tab Management">
        <SettingRow label="Tab Warning">
          <Toggle checked={settings.tabWarningEnabled} onChange={(v) => updateSetting({ tabWarningEnabled: v })} />
        </SettingRow>
        <SettingRow label="Max Tabs">
          <select
            value={settings.maxTabs}
            onChange={(e) => updateSetting({ maxTabs: parseInt(e.target.value) })}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary"
          >
            {MAX_TAB_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} tabs</option>
            ))}
          </select>
        </SettingRow>
      </Section>

      {/* Focus Overlay */}
      <Section title="🖥️ Focus Overlay">
        <SettingRow label="Enable Overlay">
          <Toggle checked={settings.focusOverlayEnabled} onChange={(v) => updateSetting({ focusOverlayEnabled: v })} />
        </SettingRow>
        <SettingRow label="Position">
          <select
            value={settings.focusOverlayPosition}
            onChange={(e) => updateSetting({ focusOverlayPosition: e.target.value as any })}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary"
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
          </select>
        </SettingRow>
        <SettingRow label="Motivational Messages">
          <Toggle checked={settings.showMotivationalMessages} onChange={(v) => updateSetting({ showMotivationalMessages: v })} />
        </SettingRow>
      </Section>

      {/* AI */}
      <Section title="🤖 AI Integration">
        <SettingRow label="Gemini API Key">
          <div className="flex gap-2 items-center">
            <input
              type={apiKeyVisible ? 'text' : 'password'}
              value={settings.geminiApiKey}
              onChange={(e) => updateSetting({ geminiApiKey: e.target.value })}
              placeholder="Enter API key"
              className="w-60 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => setApiKeyVisible(!apiKeyVisible)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {apiKeyVisible ? '🙈' : '👁️'}
            </button>
          </div>
        </SettingRow>
        <SettingRow label="AI Coaching">
          <Toggle checked={settings.aiCoachingEnabled} onChange={(v) => updateSetting({ aiCoachingEnabled: v })} />
        </SettingRow>
        <SettingRow label="Intent Check">
          <Toggle checked={settings.intentCheckEnabled} onChange={(v) => updateSetting({ intentCheckEnabled: v })} />
        </SettingRow>
        <SettingRow label="Coaching Frequency">
          <select
            value={settings.aiCoachingFrequency}
            onChange={(e) => updateSetting({ aiCoachingFrequency: e.target.value as any })}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary"
          >
            {Object.entries(AI_COACHING_FREQUENCY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </SettingRow>
      </Section>

      {/* Data */}
      <Section title="💾 Data">
        <SettingRow label="Data Retention">
          <select
            value={settings.dataRetentionDays}
            onChange={(e) => updateSetting({ dataRetentionDays: parseInt(e.target.value) })}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary"
          >
            {[30, 60, 90, 180, 365].map((d) => (
              <option key={d} value={d}>{d} days</option>
            ))}
          </select>
        </SettingRow>
      </Section>

      {/* Reset */}
      <div className="pt-4 border-t border-border/50">
        <button
          onClick={resetAll}
          className="px-4 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
        >
          🔄 Reset All Settings
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5">
      <h2 className="text-sm font-bold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-5.5 rounded-full transition-colors relative ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
      style={{ width: 40, height: 22 }}
    >
      <span
        className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
        style={{ width: 18, height: 18 }}
      />
    </button>
  );
}

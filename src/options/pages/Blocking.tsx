import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';
import { validateBlockedDomain } from '@/utils/validators';
import type { Settings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

export default function Blocking() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [newSite, setNewSite] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    if (!isChromeExtension()) { setLoading(false); return; }
    try {
      const res = await sendMessage<any>({ type: 'GET_SETTINGS' });
      if (res?.settings) setSettings(res.settings);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addSite = async () => {
    const { valid, normalized, error: validError } = validateBlockedDomain(newSite);
    if (!valid) { setError(validError || 'Invalid domain'); return; }
    
    const allSites = [...settings.blockedSites, ...settings.customBlockedSites];
    if (allSites.includes(normalized)) { setError('Site already blocked'); return; }

    const updated = { ...settings, customBlockedSites: [...settings.customBlockedSites, normalized] };
    await sendMessage({ type: 'UPDATE_SETTINGS', payload: { customBlockedSites: updated.customBlockedSites } });
    setSettings(updated);
    setNewSite('');
    setError('');
  };

  const removeSite = async (domain: string, isCustom: boolean) => {
    const key = isCustom ? 'customBlockedSites' : 'blockedSites';
    const updated = { ...settings, [key]: settings[key].filter((s) => s !== domain) };
    await sendMessage({ type: 'UPDATE_SETTINGS', payload: { [key]: updated[key] } });
    setSettings(updated);
  };

  const toggleBlocking = async () => {
    const updated = { ...settings, blockingEnabled: !settings.blockingEnabled };
    await sendMessage({ type: 'UPDATE_SETTINGS', payload: { blockingEnabled: updated.blockingEnabled } });
    setSettings(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blocked Sites</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage websites that are blocked during focus sessions</p>
        </div>
        <button
          onClick={toggleBlocking}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            settings.blockingEnabled
              ? 'bg-success/15 text-success border border-success/30'
              : 'bg-destructive/15 text-destructive border border-destructive/30'
          }`}
        >
          {settings.blockingEnabled ? '🛡️ Blocking Active' : '⚠️ Blocking Disabled'}
        </button>
      </div>

      {/* Add Site */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Add Custom Site</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSite}
            onChange={(e) => { setNewSite(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && addSite()}
            placeholder="e.g., example.com"
            className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <button
            onClick={addSite}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Add
          </button>
        </div>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>

      {/* Default Blocked Sites */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Default Blocked Sites</h3>
        <div className="grid grid-cols-2 gap-2">
          {settings.blockedSites.map((site) => (
            <SiteItem key={site} domain={site} onRemove={() => removeSite(site, false)} />
          ))}
        </div>
      </div>

      {/* Custom Blocked Sites */}
      {settings.customBlockedSites.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Custom Blocked Sites</h3>
          <div className="grid grid-cols-2 gap-2">
            {settings.customBlockedSites.map((site) => (
              <SiteItem key={site} domain={site} onRemove={() => removeSite(site, true)} isCustom />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SiteItem({ domain, onRemove, isCustom }: { domain: string; onRemove: () => void; isCustom?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group">
      <div className="flex items-center gap-2">
        <span className="text-sm">🚫</span>
        <span className="text-sm">{domain}</span>
        {isCustom && <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">Custom</span>}
      </div>
      <button
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all text-sm"
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import QuickSession from './pages/QuickSession';
import QuickStats from './pages/QuickStats';
import { useTheme } from '@/hooks/useTheme';

type Page = 'home' | 'session' | 'stats';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  useTheme();

  return (
    <div className="min-h-[520px] bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <button
          onClick={() => setPage('home')}
          className="flex items-center gap-2 group"
        >
          <span className="text-xl">🛡️</span>
          <h1 className="text-sm font-bold gradient-text">FocusGuard AI</h1>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              chrome.runtime.openOptionsPage?.();
            }}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {page === 'home' && <Home onNavigate={setPage} />}
        {page === 'session' && <QuickSession onBack={() => setPage('home')} />}
        {page === 'stats' && <QuickStats onBack={() => setPage('home')} />}
      </main>

      {/* Bottom Nav */}
      <nav className="flex items-center justify-around px-2 py-2 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <NavButton
          active={page === 'home'}
          onClick={() => setPage('home')}
          icon="🏠"
          label="Home"
        />
        <NavButton
          active={page === 'session'}
          onClick={() => setPage('session')}
          icon="🎯"
          label="Focus"
        />
        <NavButton
          active={page === 'stats'}
          onClick={() => setPage('stats')}
          icon="📊"
          label="Stats"
        />
      </nav>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all duration-200 ${active
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
        }`}
    >
      <span className="text-base">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

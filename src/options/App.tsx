import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Blocking from './pages/Blocking';
import Analytics from './pages/Analytics';
import FocusPet from './pages/FocusPet';
import Achievements from './pages/Achievements';
import WeeklyReport from './pages/WeeklyReport';
import DailyGoals from './pages/DailyGoals';
import AICoach from './pages/AICoach';
import Settings from './pages/Settings';

type PageId = 'dashboard' | 'sessions' | 'blocking' | 'analytics' | 'pet' | 'achievements' | 'report' | 'goals' | 'coach' | 'settings';

interface NavItem {
  id: PageId;
  label: string;
  icon: string;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', section: 'Overview' },
  { id: 'sessions', label: 'Sessions', icon: '🎯' },
  { id: 'goals', label: 'Daily Goals', icon: '🎯' },
  { id: 'analytics', label: 'Analytics', icon: '📈', section: 'Productivity' },
  { id: 'report', label: 'Weekly Report', icon: '📋' },
  { id: 'coach', label: 'AI Coach', icon: '🤖' },
  { id: 'blocking', label: 'Blocked Sites', icon: '🚫', section: 'Management' },
  { id: 'pet', label: 'Focus Pet', icon: '🌱' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'settings', label: 'Settings', icon: '⚙️', section: 'Preferences' },
];

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useTheme();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'sessions': return <Sessions />;
      case 'blocking': return <Blocking />;
      case 'analytics': return <Analytics />;
      case 'pet': return <FocusPet />;
      case 'achievements': return <Achievements />;
      case 'report': return <WeeklyReport />;
      case 'goals': return <DailyGoals />;
      case 'coach': return <AICoach />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const activeLabel = NAV_ITEMS.find(item => item.id === activePage)?.label || 'Dashboard';

  return (
    <div className="flex min-h-screen bg-background text-foreground flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <div>
            <h1 className="text-xs font-bold gradient-text">FocusGuard AI</h1>
            <p className="text-[8px] text-muted-foreground">{activeLabel}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-secondary/80 text-foreground hover:bg-secondary transition-colors"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[49px] bottom-0 bg-background/95 backdrop-blur-lg z-30 p-4 overflow-y-auto flex flex-col animate-[fade-in_0.2s_ease-out]">
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activePage === item.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 border-r border-border/50 bg-card/30 flex-col h-screen sticky top-0 overflow-y-auto">
        {/* Logo */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <div>
              <h1 className="text-sm font-bold gradient-text">FocusGuard AI</h1>
              <p className="text-[10px] text-muted-foreground">Productivity Companion</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <React.Fragment key={item.id}>
              {item.section && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 pt-4 pb-1">
                  {item.section}
                </p>
              )}
              <button
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activePage === item.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground text-center">v1.0.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl">
        <div className="animate-[fade-in_0.3s_ease-out]">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

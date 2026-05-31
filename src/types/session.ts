// ============================================================
// FocusGuard AI — Focus Session Types
// ============================================================

export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed' | 'cancelled';

export type SessionPriority = 'low' | 'medium' | 'high' | 'critical';

export type SessionCategory =
  | 'coding'
  | 'study'
  | 'writing'
  | 'design'
  | 'research'
  | 'reading'
  | 'planning'
  | 'communication'
  | 'other';

export interface FocusSession {
  id: string;
  taskName: string;
  duration: number;           // Total duration in minutes
  priority: SessionPriority;
  category: SessionCategory;
  status: SessionStatus;
  startTime: number;          // Unix timestamp ms
  endTime: number | null;     // Unix timestamp ms
  pausedAt: number | null;    // Unix timestamp ms
  totalPausedTime: number;    // Total paused time in ms
  breaks: SessionBreak[];
  completionPercentage: number;
  xpEarned: number;
  notes: string;
}

export interface SessionBreak {
  startTime: number;
  endTime: number | null;
  reason?: string;
}

export interface SessionFormData {
  taskName: string;
  duration: number;
  priority: SessionPriority;
  category: SessionCategory;
}

export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalFocusTime: number;     // in minutes
  averageSessionLength: number;
  completionRate: number;     // 0–100
  longestSession: number;     // in minutes
  currentStreak: number;      // consecutive days
  bestStreak: number;
}

export const SESSION_CATEGORY_LABELS: Record<SessionCategory, string> = {
  coding: '💻 Coding',
  study: '📚 Study',
  writing: '✍️ Writing',
  design: '🎨 Design',
  research: '🔬 Research',
  reading: '📖 Reading',
  planning: '📋 Planning',
  communication: '💬 Communication',
  other: '📌 Other',
};

export const SESSION_CATEGORY_COLORS: Record<SessionCategory, string> = {
  coding: '#7c3aed',
  study: '#3b82f6',
  writing: '#f59e0b',
  design: '#ec4899',
  research: '#10b981',
  reading: '#06b6d4',
  planning: '#8b5cf6',
  communication: '#f97316',
  other: '#6b7280',
};

export const SESSION_PRIORITY_COLORS: Record<SessionPriority, string> = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

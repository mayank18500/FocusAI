// ============================================================
// FocusGuard AI — Time Formatting Utilities
// ============================================================

/**
 * Format seconds into HH:MM:SS string.
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

/**
 * Format seconds into a human-readable duration (e.g., "2h 30m").
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${Math.floor(totalSeconds)}s`;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Format minutes into a human-readable duration.
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Get today's date as ISO string (YYYY-MM-DD).
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get a relative time string (e.g., "2 hours ago").
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Get the start of today (midnight) as a Unix timestamp.
 */
export function getStartOfDay(date?: Date): number {
  const d = date ? new Date(date) : new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Get the start of the week (Monday) as a Date.
 */
export function getStartOfWeek(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format a date as a short string (e.g., "Mon, Jan 5").
 */
export function formatShortDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get the day of week name.
 */
export function getDayName(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Calculate the percentage of time elapsed.
 */
export function calculateProgress(
  startTime: number,
  durationMinutes: number,
  pausedTime: number = 0
): number {
  const now = Date.now();
  const totalDuration = durationMinutes * 60 * 1000;
  const elapsed = now - startTime - pausedTime;
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
}

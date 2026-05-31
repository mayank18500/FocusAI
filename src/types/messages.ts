// ============================================================
// FocusGuard AI — Cross-Context Message Types
// Discriminated union for typed messaging between
// service worker, popup, content script, and options page.
// ============================================================

import type { FocusSession, SessionCategory, SessionPriority } from './session';
import type { DailyStats, SiteVisit, WeeklyReport } from './tracking';
import type { Pet } from './pet';
import type { Achievement } from './achievements';
import type { Settings } from './settings';

// ------ Session Messages ------

export interface StartSessionRequest {
  type: 'START_SESSION';
  payload: {
    taskName: string;
    duration: number; // in minutes
    priority: SessionPriority;
    category: SessionCategory;
  };
}

export interface StartSessionResponse {
  success: boolean;
  session?: FocusSession;
  error?: string;
}

export interface EndSessionRequest {
  type: 'END_SESSION';
  payload: {
    sessionId: string;
    reason: 'completed' | 'cancelled' | 'manual';
  };
}

export interface EndSessionResponse {
  success: boolean;
  xpEarned?: number;
  achievements?: Achievement[];
}

export interface PauseSessionRequest {
  type: 'PAUSE_SESSION';
}

export interface ResumeSessionRequest {
  type: 'RESUME_SESSION';
}

export interface GetSessionRequest {
  type: 'GET_SESSION';
}

export interface GetSessionResponse {
  session: FocusSession | null;
  timeRemaining: number; // in seconds
}

export interface GetSessionHistoryRequest {
  type: 'GET_SESSION_HISTORY';
  payload?: {
    limit?: number;
    offset?: number;
    category?: SessionCategory;
  };
}

export interface GetSessionHistoryResponse {
  sessions: FocusSession[];
  total: number;
}

// ------ Blocking Messages ------

export interface CheckBlockedRequest {
  type: 'CHECK_BLOCKED';
  payload: {
    url: string;
  };
}

export interface CheckBlockedResponse {
  isBlocked: boolean;
  sessionActive: boolean;
  taskName?: string;
  timeRemaining?: number;
}

export interface OverrideBlockRequest {
  type: 'OVERRIDE_BLOCK';
  payload: {
    url: string;
    duration: number; // in minutes
  };
}

export interface OverrideBlockResponse {
  success: boolean;
}

// ------ AI Intent Messages ------

export interface CheckIntentRequest {
  type: 'CHECK_INTENT';
  payload: {
    url: string;
    domain: string;
    reason: 'work' | 'research' | 'learning' | 'entertainment' | 'not_sure';
    currentTask?: string;
    timeRemaining?: number;
  };
}

export interface CheckIntentResponse {
  classification: 'productive' | 'distracting' | 'neutral';
  message: string;
  confidence: number;
}

// ------ Tracking Messages ------

export interface GetTrackingRequest {
  type: 'GET_TRACKING';
  payload?: {
    date?: string; // ISO date string
  };
}

export interface GetTrackingResponse {
  dailyStats: DailyStats;
  recentSites: SiteVisit[];
}

export interface GetWeeklyReportRequest {
  type: 'GET_WEEKLY_REPORT';
  payload?: {
    weekOffset?: number; // 0 = current, -1 = last week, etc.
  };
}

export interface GetWeeklyReportResponse {
  report: WeeklyReport;
}

// ------ Pet Messages ------

export interface GetPetRequest {
  type: 'GET_PET';
}

export interface GetPetResponse {
  pet: Pet;
}

// ------ Achievement Messages ------

export interface GetAchievementsRequest {
  type: 'GET_ACHIEVEMENTS';
}

export interface GetAchievementsResponse {
  achievements: Achievement[];
  recentUnlocks: Achievement[];
}

// ------ Settings Messages ------

export interface GetSettingsRequest {
  type: 'GET_SETTINGS';
}

export interface UpdateSettingsRequest {
  type: 'UPDATE_SETTINGS';
  payload: Partial<Settings>;
}

export interface SettingsResponse {
  settings: Settings;
}

// ------ Tab Management Messages ------

export interface GetTabInfoRequest {
  type: 'GET_TAB_INFO';
}

export interface GetTabInfoResponse {
  totalTabs: number;
  maxTabs: number;
  duplicateTabs: { url: string; count: number; tabIds: number[] }[];
  inactiveTabs: { tabId: number; url: string; title: string; lastActive: number }[];
}

export interface CloseTabsRequest {
  type: 'CLOSE_TABS';
  payload: {
    tabIds: number[];
  };
}

export interface CloseTabsResponse {
  success: boolean;
  closedCount: number;
}

// ------ AI Coach Messages ------

export interface GetCoachAdviceRequest {
  type: 'GET_COACH_ADVICE';
  payload?: {
    question?: string;
  };
}

export interface GetCoachAdviceResponse {
  advice: string;
  recommendations: string[];
  insights: string[];
}

// ------ Daily Goals Messages ------

export interface GetDailyGoalsRequest {
  type: 'GET_DAILY_GOALS';
}

export interface UpdateDailyGoalsRequest {
  type: 'UPDATE_DAILY_GOALS';
  payload: {
    focusHoursTarget?: number;
    tasksTarget?: number;
    sessionsTarget?: number;
  };
}

export interface DailyGoalsResponse {
  targets: {
    focusHours: number;
    tasks: number;
    sessions: number;
  };
  progress: {
    focusHours: number;
    tasks: number;
    sessions: number;
  };
}

// ------ Content Script Notifications ------

export interface ShowBlockPageMessage {
  type: 'SHOW_BLOCK_PAGE';
  payload: {
    taskName: string;
    timeRemaining: number;
    blockedUrl: string;
  };
}

export interface ShowIntentModalMessage {
  type: 'SHOW_INTENT_MODAL';
  payload: {
    url: string;
    domain: string;
    taskName?: string;
    timeRemaining?: number;
  };
}

export interface ShowFocusOverlayMessage {
  type: 'SHOW_FOCUS_OVERLAY';
  payload: {
    taskName: string;
    timeRemaining: number;
    totalDuration: number;
  };
}

export interface HideFocusOverlayMessage {
  type: 'HIDE_FOCUS_OVERLAY';
}

// ------ Union Types ------

export type ExtensionMessage =
  | StartSessionRequest
  | EndSessionRequest
  | PauseSessionRequest
  | ResumeSessionRequest
  | GetSessionRequest
  | GetSessionHistoryRequest
  | CheckBlockedRequest
  | OverrideBlockRequest
  | CheckIntentRequest
  | GetTrackingRequest
  | GetWeeklyReportRequest
  | GetPetRequest
  | GetAchievementsRequest
  | GetSettingsRequest
  | UpdateSettingsRequest
  | GetTabInfoRequest
  | CloseTabsRequest
  | GetCoachAdviceRequest
  | GetDailyGoalsRequest
  | UpdateDailyGoalsRequest
  | ShowBlockPageMessage
  | ShowIntentModalMessage
  | ShowFocusOverlayMessage
  | HideFocusOverlayMessage;

export type MessageType = ExtensionMessage['type'];

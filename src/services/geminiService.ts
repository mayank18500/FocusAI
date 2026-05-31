// ============================================================
// FocusGuard AI — Gemini AI Service
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getClient(apiKey: string): GoogleGenerativeAI {
  if (!genAI || apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// ------ Intent Check ------

export interface IntentCheckResult {
  classification: 'productive' | 'distracting' | 'neutral';
  message: string;
  confidence: number;
}

export async function checkIntent(
  apiKey: string,
  params: {
    url: string;
    domain: string;
    reason: string;
    currentTask?: string;
    timeRemaining?: number;
  }
): Promise<IntentCheckResult> {
  try {
    const client = getClient(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are FocusGuard AI, a productivity assistant embedded in a browser extension. A user is trying to visit a website during a focus session. Analyze their intent and provide guidance.

Context:
- Website they want to visit: ${params.domain} (${params.url})
- Their stated reason: ${params.reason}
- Current focus task: ${params.currentTask || 'Not specified'}
- Time remaining in session: ${params.timeRemaining ? `${Math.floor(params.timeRemaining / 60)} minutes` : 'Not in a session'}

Analyze whether this visit is likely productive, distracting, or neutral given their current task and stated reason.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "classification": "productive" or "distracting" or "neutral",
  "message": "A brief, friendly 1-2 sentence explanation of your assessment and suggestion",
  "confidence": 0.0 to 1.0
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON response, handling possible markdown code fences
    const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      classification: parsed.classification || 'neutral',
      message: parsed.message || 'Unable to determine intent.',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
    };
  } catch (error) {
    console.warn('[FocusGuard] Intent check failed (returning fallback):', error);
    return {
      classification: 'neutral',
      message: 'I couldn\'t analyze this request right now. Use your best judgment!',
      confidence: 0,
    };
  }
}

// ------ AI Coach ------

export interface CoachAdvice {
  advice: string;
  recommendations: string[];
  insights: string[];
}

export async function getCoachAdvice(
  apiKey: string,
  params: {
    focusHistory: { date: string; focusTime: number; distractionTime: number; sessions: number }[];
    currentStreak: number;
    totalSessions: number;
    averageSessionLength: number;
    topDistractions: string[];
    question?: string;
  }
): Promise<CoachAdvice> {
  try {
    const client = getClient(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const historyStr = params.focusHistory
      .slice(0, 7)
      .map(
        (d) =>
          `${d.date}: Focus ${Math.round(d.focusTime / 60)}min, Distraction ${Math.round(d.distractionTime / 60)}min, ${d.sessions} sessions`
      )
      .join('\n');

    const prompt = `You are FocusGuard AI Coach, a warm and insightful productivity coach. Based on the user's recent focus data, provide personalized advice.

User Stats:
- Current Streak: ${params.currentStreak} days
- Total Sessions Completed: ${params.totalSessions}
- Average Session Length: ${Math.round(params.averageSessionLength)} minutes
- Top Distracting Sites: ${params.topDistractions.join(', ') || 'None tracked'}

Recent History:
${historyStr || 'No recent data available'}

${params.question ? `User's Question: "${params.question}"` : 'Provide daily recommendations.'}

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "advice": "A warm, personalized 2-3 sentence main piece of advice",
  "recommendations": ["3-5 specific, actionable recommendations as short strings"],
  "insights": ["2-3 interesting observations about their patterns as short strings"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      advice: parsed.advice || 'Keep up the great work with your focus sessions!',
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
    };
  } catch (error) {
    console.warn('[FocusGuard] Coach advice failed (returning fallback):', error);
    return {
      advice: 'Keep focusing on your goals! Every session counts toward building better habits.',
      recommendations: [
        'Try starting your day with a focused session',
        'Take short breaks between sessions to recharge',
        'Set specific goals for each focus session',
      ],
      insights: [
        'Consistency is more important than intensity',
      ],
    };
  }
}

// ------ Weekly Insights ------

export async function getWeeklyInsights(
  apiKey: string,
  params: {
    totalFocusHours: number;
    totalDistractionHours: number;
    sessionsCompleted: number;
    completionRate: number;
    topProductiveSites: string[];
    topDistractingSites: string[];
    focusScore: number;
    streakDays: number;
  }
): Promise<string[]> {
  try {
    const client = getClient(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are FocusGuard AI, generating weekly productivity insights. Be specific and encouraging.

Weekly Stats:
- Focus Time: ${params.totalFocusHours.toFixed(1)} hours
- Distraction Time: ${params.totalDistractionHours.toFixed(1)} hours
- Sessions Completed: ${params.sessionsCompleted}
- Completion Rate: ${params.completionRate}%
- Focus Score: ${params.focusScore}/100
- Streak: ${params.streakDays} days
- Most Productive Sites: ${params.topProductiveSites.join(', ') || 'None'}
- Most Distracting Sites: ${params.topDistractingSites.join(', ') || 'None'}

Respond ONLY with a JSON array of 3-5 short insight strings (no markdown, no code fences):
["insight 1", "insight 2", "insight 3"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.warn('[FocusGuard] Weekly insights failed (returning fallback):', error);
    return ['Keep tracking your productivity to get personalized insights!'];
  }
}

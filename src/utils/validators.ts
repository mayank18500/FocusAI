// ============================================================
// FocusGuard AI — Input Validators
// ============================================================

import { isValidDomain } from './urlMatcher';

/**
 * Validate session form data.
 */
export function validateSessionForm(data: {
  taskName: string;
  duration: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.taskName || data.taskName.trim().length === 0) {
    errors.push('Task name is required');
  } else if (data.taskName.length > 100) {
    errors.push('Task name must be 100 characters or less');
  }

  if (!data.duration || data.duration < 1) {
    errors.push('Duration must be at least 1 minute');
  } else if (data.duration > 480) {
    errors.push('Duration cannot exceed 8 hours');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a domain for the block list.
 */
export function validateBlockedDomain(domain: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = domain
    .trim()
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/.*$/, '');

  if (!normalized) {
    return { valid: false, normalized: '', error: 'Domain cannot be empty' };
  }

  if (!isValidDomain(normalized)) {
    return { valid: false, normalized, error: 'Invalid domain format' };
  }

  return { valid: true, normalized };
}

/**
 * Clean Gemini API Key (strip brackets, quotes, whitespace).
 */
export function cleanApiKey(key: string): string {
  let cleaned = key.trim();
  // Remove wrapping quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  // Remove wrapping square brackets
  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
}

/**
 * Validate Gemini API key format.
 */
export function validateApiKey(key: string): boolean {
  const cleaned = cleanApiKey(key);
  if (cleaned.length === 0) return false;
  // Gemini API keys are typically 39+ characters
  return cleaned.length >= 20;
}


/**
 * Sanitize user input (strip HTML, limit length).
 */
export function sanitizeInput(input: string, maxLength: number = 200): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'&]/g, '')
    .trim()
    .slice(0, maxLength);
}

// ============================================================
// FocusGuard AI — URL Matching Utilities
// ============================================================

/**
 * Extract the domain from a URL string.
 * Returns empty string if parsing fails.
 */
export function extractDomain(url: string): string {
  try {
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return '';
    }
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Check if a URL matches any domain in the blocked list.
 * Supports exact domain matching and subdomain matching.
 */
export function isBlocked(url: string, blockedDomains: string[]): boolean {
  const domain = extractDomain(url);
  if (!domain) return false;

  return blockedDomains.some((blocked) => {
    const cleanBlocked = blocked.replace(/^www\./, '').toLowerCase();
    const cleanDomain = domain.toLowerCase();
    // Exact match or subdomain match
    return cleanDomain === cleanBlocked || cleanDomain.endsWith(`.${cleanBlocked}`);
  });
}

/**
 * Check if a URL is a Chrome internal page.
 */
export function isChromeInternal(url: string): boolean {
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:') ||
    url.startsWith('edge://') ||
    url.startsWith('brave://') ||
    url === ''
  );
}

/**
 * Validate a domain string for the block list.
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length < 3) return false;
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
  return domainRegex.test(domain.replace(/^www\./, ''));
}

/**
 * Normalize a domain string (remove www, lowercase).
 */
export function normalizeDomain(domain: string): string {
  return domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '').toLowerCase();
}

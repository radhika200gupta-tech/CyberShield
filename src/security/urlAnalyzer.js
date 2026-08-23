/**
 * urlAnalyzer.js
 *
 * Uses JavaScript's built-in URL API to break a raw URL string down into
 * its structural parts. This is purely structural parsing — it does not
 * decide anything about risk. Risk decisions live in securityRules.js
 * and riskEngine.js.
 */

/**
 * Normalizes a raw user-entered string into something the URL API can
 * parse. If the user forgot a protocol (e.g. "example.com/login"),
 * we assume https:// so the scanner still works.
 */
export function normalizeUrlInput(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Attempts to parse a URL string. Returns { ok: true, url } or
 * { ok: false, error }.
 */
export function tryParseUrl(raw) {
  const normalized = normalizeUrlInput(raw);
  try {
    const url = new URL(normalized);
    return { ok: true, url, normalized };
  } catch (err) {
    return { ok: false, error: 'That does not look like a valid URL.' };
  }
}

/**
 * Counts subdomain levels for a hostname, excluding the registrable
 * domain + TLD. This is a simple heuristic (not a public-suffix-list
 * based implementation), which is sufficient for a rule-based demo.
 */
function countSubdomains(hostname) {
  if (!hostname || isIpAddress(hostname)) return 0;
  const parts = hostname.split('.').filter(Boolean);
  if (parts.length <= 2) return 0;
  return parts.length - 2;
}

/**
 * Detects whether a hostname is a raw IPv4 or IPv6 address rather than
 * a domain name.
 */
export function isIpAddress(hostname) {
  if (!hostname) return false;
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^\[?[a-fA-F0-9:]+\]?$/;
  if (ipv4.test(hostname)) {
    return hostname.split('.').every((octet) => Number(octet) <= 255);
  }
  return hostname.includes(':') && ipv6.test(hostname);
}

/**
 * Splits a hostname into a "subdomain" label and a "domain" label for
 * display purposes (e.g. "URL Anatomy"). This is a simple heuristic
 * (last two dot-separated labels = domain, everything before = the
 * subdomain), not a public-suffix-list implementation — good enough
 * for a rule-based demo.
 */
export function getDomainParts(hostname) {
  if (!hostname) return { subdomain: '', domain: '' };
  if (isIpAddress(hostname)) return { subdomain: '', domain: hostname };
  const parts = hostname.split('.').filter(Boolean);
  if (parts.length <= 2) return { subdomain: '', domain: hostname };
  return {
    subdomain: parts.slice(0, parts.length - 2).join('.'),
    domain: parts.slice(-2).join('.'),
  };
}

/**
 * Builds a flat "URL intelligence" summary object from a parsed URL,
 * used directly by the URLIntelligence UI component.
 */
export function buildUrlIntelligence(url, rawInput) {
  const { subdomain, domain } = getDomainParts(url.hostname);
  return {
    protocol: url.protocol.replace(':', '').toUpperCase(),
    hostname: url.hostname,
    subdomain,
    domain,
    port: url.port || (url.protocol === 'https:' ? '443 (default)' : '80 (default)'),
    hasExplicitPort: !!url.port,
    path: url.pathname || '/',
    query: url.search || '—',
    urlLength: rawInput.length,
    subdomains: countSubdomains(url.hostname),
    isIp: isIpAddress(url.hostname),
    hasAt: rawInput.includes('@'),
  };
}

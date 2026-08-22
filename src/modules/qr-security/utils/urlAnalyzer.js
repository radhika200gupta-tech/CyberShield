/**
 * urlAnalyzer.js (qr-security module)
 *
 * Structural + heuristic analysis of a URL found inside a QR code.
 * Uses the browser URL API, regex, and a small static rule set from
 * data/qrThreatPatterns.js. This is NOT real threat intelligence —
 * it never claims a destination is definitively safe or malicious,
 * only that certain patterns were or weren't observed.
 *
 * Output is a flat list of "signals" consumed by riskEngine.js, which
 * is the only place that turns signals into a score. Keeping analysis
 * separate from scoring means the rules here can later be swapped for
 * a backend/threat-intel call (see module README) without touching
 * the risk engine or UI.
 */

import {
  SUSPICIOUS_KEYWORDS,
  BRAND_IMPERSONATION_PATTERNS,
  SUSPICIOUS_TLDS,
  URL_SHORTENERS,
} from '../data/qrThreatPatterns';

function isIpAddress(hostname) {
  if (!hostname) return false;
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4.test(hostname)) {
    return hostname.split('.').every((octet) => Number(octet) <= 255);
  }
  return hostname.includes(':') && /^\[?[a-fA-F0-9:]+\]?$/.test(hostname);
}

function countSubdomains(hostname) {
  if (!hostname || isIpAddress(hostname)) return 0;
  const parts = hostname.split('.').filter(Boolean);
  return Math.max(0, parts.length - 2);
}

function hasSuspiciousEncoding(rawUrl) {
  // Multiple percent-encoded sequences, or an @ used to smuggle a
  // different "real" host before the browser-visible one.
  const encodedCount = (rawUrl.match(/%[0-9a-f]{2}/gi) || []).length;
  const hasAtSmuggle = /^https?:\/\/[^/]*@/i.test(rawUrl);
  return encodedCount >= 3 || hasAtSmuggle;
}

/**
 * Runs the full set of heuristic checks against a URL string and
 * returns { ok, url, signals } where signals is an array of:
 *   { id, triggered, severity, label }
 */
export function analyzeUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      ok: false,
      url: null,
      signals: [
        {
          id: 'unparseable',
          triggered: true,
          severity: 'high',
          label: 'URL could not be parsed',
        },
      ],
    };
  }

  const hostname = url.hostname || '';
  const fullTarget = `${hostname}${url.pathname}${url.search}`.toLowerCase();
  const isIp = isIpAddress(hostname);
  const subdomainCount = countSubdomains(hostname);
  const isShortener = URL_SHORTENERS.some((s) => hostname.toLowerCase() === s || hostname.toLowerCase().endsWith(`.${s}`));

  const matchedKeyword = SUSPICIOUS_KEYWORDS.find((kw) => fullTarget.includes(kw));
  const matchedBrandPattern = BRAND_IMPERSONATION_PATTERNS.some((re) => re.test(hostname));
  const matchedSuspiciousTld = SUSPICIOUS_TLDS.some((tld) => hostname.toLowerCase().endsWith(tld));

  const signals = [
    {
      id: 'https',
      triggered: url.protocol !== 'https:',
      severity: 'medium',
      label:
        url.protocol === 'https:'
          ? 'HTTPS enabled'
          : 'Unencrypted HTTP connection',
    },
    {
      id: 'ip-host',
      triggered: isIp,
      severity: 'high',
      label: isIp ? 'Destination is a raw IP address, not a domain' : 'Normal domain structure',
    },
    {
      id: 'brand-impersonation',
      triggered: matchedBrandPattern,
      severity: 'high',
      label: matchedBrandPattern
        ? 'Possible brand impersonation in domain'
        : 'No obvious brand impersonation detected',
    },
    {
      id: 'suspicious-keyword',
      triggered: !!matchedKeyword,
      severity: 'medium',
      label: matchedKeyword
        ? `Suspicious keyword in URL ("${matchedKeyword}")`
        : 'No suspicious keywords found',
    },
    {
      id: 'excessive-subdomains',
      triggered: subdomainCount >= 3,
      severity: 'medium',
      label:
        subdomainCount >= 3
          ? `Unusual domain structure (${subdomainCount} subdomain levels)`
          : 'Normal subdomain depth',
    },
    {
      id: 'long-url',
      triggered: rawUrl.length > 90,
      severity: 'low',
      label: rawUrl.length > 90 ? 'Unusually long URL' : 'Reasonable URL length',
    },
    {
      id: 'suspicious-encoding',
      triggered: hasSuspiciousEncoding(rawUrl),
      severity: 'high',
      label: hasSuspiciousEncoding(rawUrl)
        ? 'Suspicious character encoding detected'
        : 'No suspicious encoding detected',
    },
    {
      id: 'suspicious-tld',
      triggered: matchedSuspiciousTld,
      severity: 'low',
      label: matchedSuspiciousTld
        ? 'Domain uses a TLD often associated with abuse'
        : 'Domain extension is common',
    },
    {
      id: 'shortener',
      triggered: isShortener,
      severity: 'low',
      label: isShortener
        ? 'Link shortener — real destination is hidden'
        : 'Destination is directly visible',
    },
  ];

  return { ok: true, url, signals };
}

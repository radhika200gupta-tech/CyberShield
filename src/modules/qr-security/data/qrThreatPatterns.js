/**
 * qrThreatPatterns.js
 *
 * Static pattern data used by urlAnalyzer.js to flag suspicious QR
 * destinations. This is intentionally simple, rule-based data — not a
 * threat-intelligence feed. Kept separate from logic so the patterns can
 * be tuned later without touching the analyzer itself.
 */

// Keywords that commonly appear in credential-harvesting / phishing URLs.
// Matched case-insensitively against hostname + path + query.
export const SUSPICIOUS_KEYWORDS = [
  'login',
  'verify',
  'verification',
  'account',
  'secure',
  'security',
  'password',
  'payment',
  'wallet',
  'bank',
  'confirm',
  'update',
  'signin',
  'unlock',
  'suspended',
];

// Crude brand-impersonation patterns: common look-alike misspellings of
// well-known brands, often combined with hyphens or digit substitution.
export const BRAND_IMPERSONATION_PATTERNS = [
  /paypa1/i,
  /micr0soft/i,
  /amaz0n/i,
  /g00gle/i,
  /faceb00k/i,
  /appleid-?[a-z0-9-]*\.(?!apple\.com)/i,
  /pay-?pal-?login/i,
  /(bank|secure|login)-[a-z0-9]+-(verify|confirm|update)/i,
];

// Free / disposable-looking shorteners and hosting patterns often abused
// to mask a real destination. Not a judgement of the service itself —
// just a "worth a second look" signal.
export const SUSPICIOUS_TLDS = ['.xyz', '.top', '.zip', '.icu', '.click', '.gq', '.tk', '.cf', '.ml'];

export const URL_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'cutt.ly',
  'rebrand.ly',
];

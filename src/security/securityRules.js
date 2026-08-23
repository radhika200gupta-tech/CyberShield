/**
 * securityRules.js
 *
 * A modular set of heuristic, regex-based rules. Each rule is a small
 * function that receives the parsed URL context and returns a result
 * describing whether it triggered, how many risk points it contributes,
 * and a human-readable explanation.
 *
 * IMPORTANT: These are heuristics only. A triggered rule flags a
 * *pattern* commonly associated with suspicious URLs — it does not
 * prove the URL is malicious, and no external threat intelligence
 * feed is consulted.
 *
 * Keep this list easy to extend: add a new object to RULES with the
 * same shape and it will automatically be picked up by the risk engine.
 */

import { isIpAddress } from './urlAnalyzer';

// Suspicious keyword list — intentionally simple and editable.
const SUSPICIOUS_KEYWORDS = [
  'login',
  'verify',
  'account',
  'password',
  'secure',
  'update',
  'banking',
  'confirm',
  'signin',
  'wallet',
];

const SUSPICIOUS_KEYWORD_REGEX = new RegExp(`(${SUSPICIOUS_KEYWORDS.join('|')})`, 'i');
const AT_SYMBOL_REGEX = /@/;
const SUSPICIOUS_CHARS_REGEX = /[<>{}|\\^~`\[\]]/;
const MANY_HYPHENS_REGEX = /(-.*){3,}/; // e.g. secure-login-verify-bank.com
const PUNYCODE_REGEX = /xn--/i;

export const RULES = [
  {
    id: 'ip-hostname',
    name: 'IP Address Detection',
    points: 25,
    evaluate: (ctx) => {
      const triggered = isIpAddress(ctx.url.hostname);
      return {
        triggered,
        message: triggered
          ? 'The hostname is a raw IP address rather than a domain name — a pattern often used to disguise a destination.'
          : 'Hostname is a standard domain name, not a raw IP address.',
      };
    },
  },
  {
    id: 'at-symbol',
    name: '"@" Symbol in URL',
    points: 20,
    evaluate: (ctx) => {
      const triggered = AT_SYMBOL_REGEX.test(ctx.raw);
      return {
        triggered,
        message: triggered
          ? 'An "@" symbol was found — browsers ignore everything before it, which can be used to hide the real destination.'
          : 'No "@" symbol present in the URL.',
      };
    },
  },
  {
    id: 'suspicious-keyword',
    name: 'Suspicious Keyword',
    points: 15,
    evaluate: (ctx) => {
      const match = ctx.raw.match(SUSPICIOUS_KEYWORD_REGEX);
      return {
        triggered: !!match,
        message: match
          ? `A potentially suspicious keyword ("${match[0]}") was detected in the URL.`
          : 'No suspicious keywords detected.',
      };
    },
  },
  {
    id: 'url-length',
    name: 'Excessive URL Length',
    points: 10,
    evaluate: (ctx) => {
      const triggered = ctx.raw.length > 75;
      return {
        triggered,
        message: triggered
          ? `URL is unusually long (${ctx.raw.length} characters), a pattern sometimes used to obscure content.`
          : `URL length (${ctx.raw.length} characters) is within a typical range.`,
      };
    },
  },
  {
    id: 'suspicious-chars',
    name: 'Suspicious Characters',
    points: 10,
    evaluate: (ctx) => {
      const triggered = SUSPICIOUS_CHARS_REGEX.test(ctx.raw);
      return {
        triggered,
        message: triggered
          ? 'Unusual characters were found in the URL that rarely appear in legitimate links.'
          : 'No unusual or malformed characters detected.',
      };
    },
  },
  {
    id: 'https',
    name: 'HTTPS Connection',
    points: 0,
    negativePoints: 5,
    evaluate: (ctx) => {
      const isHttps = ctx.url.protocol === 'https:';
      return {
        triggered: !isHttps,
        message: isHttps
          ? 'Connection uses HTTPS encryption.'
          : 'Connection does not use HTTPS — data sent to this site may be unencrypted.',
      };
    },
  },
  {
    id: 'many-subdomains',
    name: 'Excessive Subdomains',
    points: 10,
    evaluate: (ctx) => {
      const triggered = ctx.intelligence.subdomains >= 3;
      return {
        triggered,
        message: triggered
          ? `Hostname has ${ctx.intelligence.subdomains} subdomain levels, which can be used to imitate a trusted domain.`
          : 'Subdomain depth is within a normal range.',
      };
    },
  },
  {
    id: 'many-hyphens',
    name: 'Excessive Hyphens in Hostname',
    points: 10,
    evaluate: (ctx) => {
      const triggered = MANY_HYPHENS_REGEX.test(ctx.url.hostname);
      return {
        triggered,
        message: triggered
          ? 'Hostname contains an unusually high number of hyphens, a pattern seen in lookalike domains.'
          : 'Hostname hyphenation looks typical.',
      };
    },
  },
  {
    id: 'punycode',
    name: 'Punycode / IDN Hostname',
    points: 15,
    evaluate: (ctx) => {
      const triggered = PUNYCODE_REGEX.test(ctx.url.hostname);
      return {
        triggered,
        message: triggered
          ? 'Hostname uses punycode encoding, which can be used to visually spoof a trusted domain.'
          : 'No punycode encoding detected in the hostname.',
      };
    },
  },
];

/**
 * Runs every rule against a shared analysis context and returns the
 * full list of rule results (both triggered and not).
 */
export function evaluateRules({ url, raw, intelligence }) {
  const ctx = { url, raw, intelligence };
  return RULES.map((rule) => {
    const result = rule.evaluate(ctx);
    return {
      id: rule.id,
      name: rule.name,
      points: rule.points,
      negativePoints: rule.negativePoints || 0,
      triggered: result.triggered,
      message: result.message,
    };
  });
}

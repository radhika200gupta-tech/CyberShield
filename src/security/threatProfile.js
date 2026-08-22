/**
 * threatProfile.js
 *
 * Groups the EXISTING security rules into the 5 axes shown on the
 * Threat Profile radar. This is presentation-only regrouping of data
 * that securityRules.js / riskEngine.js already produced — no new
 * detection or scoring happens here. A rule can reasonably inform
 * more than one axis (e.g. punycode is both a domain-identity issue
 * and an obfuscation technique), same as a real analyst would tag it.
 */

const AXES = [
  { key: 'phishing', label: 'Phishing Risk', ruleIds: ['at-symbol', 'punycode'] },
  { key: 'domain', label: 'Domain Risk', ruleIds: ['ip-hostname', 'many-subdomains', 'many-hyphens'] },
  { key: 'complexity', label: 'URL Complexity', ruleIds: ['url-length', 'many-subdomains', 'many-hyphens'] },
  { key: 'obfuscation', label: 'Obfuscation', ruleIds: ['at-symbol', 'suspicious-chars', 'punycode'] },
  { key: 'keywords', label: 'Suspicious Keywords', ruleIds: ['suspicious-keyword'] },
];

/**
 * Maps a rule id to the URL component that finding is about, for
 * display purposes in the evidence panel.
 */
export const RULE_COMPONENT = {
  'ip-hostname': 'Hostname',
  'at-symbol': 'Full URL',
  'suspicious-keyword': 'Path / Query',
  'url-length': 'Full URL',
  'suspicious-chars': 'Query / Path',
  https: 'Protocol',
  'many-subdomains': 'Hostname',
  'many-hyphens': 'Hostname',
  punycode: 'Hostname',
};

export function severityLabel(rule) {
  const weight = rule.triggered ? rule.points : 0;
  if (weight >= 20) return 'High';
  if (weight >= 10) return 'Medium';
  if (weight > 0) return 'Low';
  if (rule.id === 'https' && rule.triggered) return 'Medium';
  return 'Informational';
}

/**
 * Builds the 5-axis Threat Profile data. Each axis's percent is the
 * same "earned / possible" derivation used elsewhere in the app —
 * just grouped along different lines to tell the "why" story.
 */
export function buildThreatProfile(ruleBreakdown) {
  const byId = Object.fromEntries(ruleBreakdown.map((r) => [r.id, r]));

  return AXES.map((axis) => {
    let earned = 0;
    let possible = 0;
    const evidence = [];

    for (const id of axis.ruleIds) {
      const rule = byId[id];
      if (!rule) continue;
      possible += rule.points || 1;
      if (rule.triggered) {
        earned += rule.points || 1;
        evidence.push({
          id: rule.id,
          name: rule.name,
          message: rule.message,
          severity: severityLabel(rule),
          component: RULE_COMPONENT[rule.id] || 'URL',
        });
      }
    }

    const percent = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    return { key: axis.key, label: axis.label, percent, evidence };
  });
}

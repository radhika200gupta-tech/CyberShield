/**
 * riskEngine.js (qr-security module)
 *
 * Reduces a list of analyzer signals down to a single bounded
 * riskScore (0-100), a riskLevel classification, and a human-readable
 * findings list. Nothing here inspects a URL directly — it only ever
 * works from the signals it's handed, so this module stays swappable:
 * a future backend/threat-intel response can be shaped into the same
 * { signals } input and nothing else has to change.
 */

// Point value awarded per triggered signal, by severity. Kept as a
// simple, easy-to-tune table.
const SEVERITY_POINTS = {
  high: 32,
  medium: 16,
  low: 8,
};

export const RISK_LEVELS = {
  SAFE: { key: 'SAFE', label: 'SAFE', min: 0, max: 29 },
  CAUTION: { key: 'CAUTION', label: 'CAUTION', min: 30, max: 59 },
  SUSPICIOUS: { key: 'SUSPICIOUS', label: 'SUSPICIOUS', min: 60, max: 79 },
  DANGEROUS: { key: 'DANGEROUS', label: 'DANGEROUS', min: 80, max: 100 },
};

export function classifyRiskScore(score) {
  if (score <= 29) return RISK_LEVELS.SAFE;
  if (score <= 59) return RISK_LEVELS.CAUTION;
  if (score <= 79) return RISK_LEVELS.SUSPICIOUS;
  return RISK_LEVELS.DANGEROUS;
}

/**
 * Computes risk from a list of analyzer signals:
 * { id, triggered, severity, label }[]
 *
 * Returns { riskScore, riskLevel, findings }, where findings is a list
 * of { text, status } — status is 'warning' | 'ok', used to render
 * icon + text (never color alone).
 */
export function calculateRisk(signals) {
  const rawScore = signals.reduce((sum, signal) => {
    if (!signal.triggered) return sum;
    return sum + (SEVERITY_POINTS[signal.severity] || 10);
  }, 0);

  const riskScore = Math.min(100, Math.max(0, rawScore));
  const riskLevel = classifyRiskScore(riskScore);

  const findings = signals.map((signal) => ({
    text: signal.label,
    status: signal.triggered ? 'warning' : 'ok',
  }));

  // Always surface a positive "decoded successfully" finding first so
  // even a DANGEROUS result shows at least one confirmed fact.
  findings.unshift({ text: 'QR code successfully decoded', status: 'ok' });

  return { riskScore, riskLevel, findings };
}

/**
 * For non-URL content (email, phone, wifi, text) there is nothing to
 * run heuristics against — these types get a neutral, low-risk result
 * built from a short fixed set of findings rather than the signal
 * pipeline above.
 */
export function assessNonUrlContent(type) {
  const findings = [{ text: 'QR code successfully decoded', status: 'ok' }];

  switch (type) {
    case 'EMAIL':
      findings.push({ text: 'Content type: email address', status: 'ok' });
      findings.push({ text: 'No destination URL to analyze', status: 'ok' });
      break;
    case 'PHONE':
      findings.push({ text: 'Content type: phone number', status: 'ok' });
      findings.push({ text: 'No destination URL to analyze', status: 'ok' });
      break;
    case 'WIFI':
      findings.push({ text: 'Content type: Wi-Fi network credentials', status: 'ok' });
      findings.push({ text: 'Credentials are only visible after you reveal them', status: 'ok' });
      break;
    default:
      findings.push({ text: 'Content type: plain text', status: 'ok' });
      break;
  }

  return { riskScore: 5, riskLevel: RISK_LEVELS.SAFE, findings };
}

export function recommendationFor(riskLevelKey) {
  switch (riskLevelKey) {
    case 'DANGEROUS':
      return 'Do not open this destination or provide sensitive information.';
    case 'SUSPICIOUS':
      return 'Avoid entering credentials until you can verify the destination.';
    case 'CAUTION':
      return 'Proceed carefully — verify the destination before entering sensitive information.';
    default:
      return 'No obvious security concerns were detected. Verify the destination before entering sensitive information.';
  }
}

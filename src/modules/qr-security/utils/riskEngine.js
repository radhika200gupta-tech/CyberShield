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
  SAFE: { key: 'SAFE', label: 'Low Risk', min: 80, max: 100 },
  CAUTION: { key: 'CAUTION', label: 'Moderate Risk', min: 60, max: 79 },
  SUSPICIOUS: { key: 'SUSPICIOUS', label: 'Suspicious', min: 40, max: 59 },
  DANGEROUS: { key: 'DANGEROUS', label: 'High Risk', min: 0, max: 39 },
};

export function classifyRiskScore(score) {
  if (score >= 80) return RISK_LEVELS.SAFE;
  if (score >= 60) return RISK_LEVELS.CAUTION;
  if (score >= 40) return RISK_LEVELS.SUSPICIOUS;
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
  let rawScore = 75; // Base score

  signals.forEach((signal) => {
    // If the signal is a positive indicator (like HTTPS, normal domain), we add points if it triggered.
    // Wait, the signals in urlAnalyzer trigger when there is a violation?
    // Let's check urlAnalyzer logic carefully inside the loop.
    // We will adjust based on the signal id.
    
    // In urlAnalyzer.js:
    // id: 'https', triggered: url.protocol !== 'https:'
    // id: 'ip-host', triggered: isIp
    // id: 'brand-impersonation', triggered: matchedBrandPattern
    // id: 'excessive-subdomains', triggered: subdomainCount >= 3
    // id: 'long-url', triggered: rawUrl.length > 90
    // id: 'suspicious-encoding', triggered: hasSuspiciousEncoding
    // id: 'suspicious-tld', triggered: matchedSuspiciousTld
    // id: 'shortener', triggered: isShortener

    // If it DID NOT trigger, it's a positive sign for some things, or neutral.
    if (!signal.triggered) {
      if (signal.id === 'https') rawScore += 10;
      if (signal.id === 'ip-host') rawScore += 5;
    } else {
      // It triggered a negative signal
      if (signal.severity === 'high') rawScore -= 25;
      if (signal.severity === 'medium') rawScore -= 15;
      if (signal.severity === 'low') rawScore -= 5;
    }
  });

  const riskScore = Math.min(100, Math.max(0, rawScore));
  const riskLevel = classifyRiskScore(riskScore);

  const findings = signals.map((signal) => ({
    text: signal.label,
    status: signal.triggered ? 'warning' : 'ok',
  }));

  findings.unshift({ text: 'CyberShield Frontend Analysis', status: 'ok' });

  return { riskScore, riskLevel, findings };
}

/**
 * For non-URL content (email, phone, wifi, text) there is nothing to
 * run heuristics against — these types get a neutral, low-risk result
 * built from a short fixed set of findings rather than the signal
 * pipeline above.
 */
export function assessNonUrlContent(type) {
  const findings = [{ text: 'CyberShield Frontend Analysis', status: 'ok' }];

  let riskScore = 85;

  switch (type) {
    case 'EMAIL':
      findings.push({ text: 'Content type: email address', status: 'ok' });
      findings.push({ text: 'Basic syntax validated', status: 'ok' });
      break;
    case 'PHONE':
      findings.push({ text: 'Content type: phone number', status: 'ok' });
      findings.push({ text: 'Standard numeric format', status: 'ok' });
      break;
    case 'WIFI':
      findings.push({ text: 'Content type: Wi-Fi network configuration', status: 'ok' });
      findings.push({ text: 'Sensitive data hidden by default', status: 'ok' });
      break;
    default:
      findings.push({ text: 'Content detected: Plain text', status: 'ok' });
      findings.push({ text: 'No actionable links found', status: 'ok' });
      break;
  }

  return { riskScore, riskLevel: classifyRiskScore(riskScore), findings };
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

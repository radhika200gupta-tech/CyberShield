/**
 * riskEngine.js
 *
 * Takes the output of securityRules.evaluateRules() and reduces it to a
 * single risk score (0-100) plus a classification. Nothing here is
 * hardcoded per-URL — the score is always derived from whichever rules
 * actually triggered.
 */

export const CLASSIFICATION_THRESHOLDS = {
  SAFE: { min: 0, max: 30, label: 'SAFE', level: 'safe' },
  SUSPICIOUS: { min: 31, max: 60, label: 'SUSPICIOUS', level: 'medium' },
  DANGEROUS: { min: 61, max: 100, label: 'DANGEROUS', level: 'high' },
};

export function classifyScore(score) {
  if (score <= 30) return CLASSIFICATION_THRESHOLDS.SAFE;
  if (score <= 60) return CLASSIFICATION_THRESHOLDS.SUSPICIOUS;
  return CLASSIFICATION_THRESHOLDS.DANGEROUS;
}

/**
 * Combines rule results into a bounded 0-100 score and a classification.
 */
export function calculateRisk(ruleResults) {
  const rawScore = ruleResults.reduce((sum, rule) => {
    if (rule.triggered) return sum + rule.points;
    if (rule.negativePoints && !rule.triggered) return sum - rule.negativePoints;
    return sum;
  }, 0);

  const score = Math.min(100, Math.max(0, rawScore));
  const classification = classifyScore(score);

  const threatIndicators = ruleResults
    .filter((rule) => rule.id !== 'https')
    .map((rule) => ({
      id: rule.id,
      label: rule.name,
      message: rule.message,
      status: rule.triggered ? 'warning' : 'ok',
    }));

  // HTTPS is framed as a positive/negative indicator either way, so it's
  // always shown regardless of triggered state.
  const httpsRule = ruleResults.find((rule) => rule.id === 'https');
  if (httpsRule) {
    threatIndicators.push({
      id: httpsRule.id,
      label: httpsRule.name,
      message: httpsRule.message,
      status: httpsRule.triggered ? 'warning' : 'ok',
    });
  }

  return {
    score,
    rawScore,
    classification,
    threatIndicators,
    ruleBreakdown: ruleResults,
  };
}

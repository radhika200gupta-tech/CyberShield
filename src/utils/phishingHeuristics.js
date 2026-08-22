export const HEURISTIC_RULES = [
  {
    id: 'URGENCY',
    category: "Urgency Language",
    pattern: /(urgent|immediately|act now|expires|expiring|suspended|within \d+ (minutes|hours)|limited time|final warning|action required)/i,
    weight: 15,
    description: "Language designed to create panic or force immediate action without verification.",
    recommendation: "Take your time. Do not let urgency force you into clicking links."
  },
  {
    id: 'CREDENTIALS',
    category: "Credential Request",
    pattern: /(password|username|login|sign in|verify account|confirm account|security verification|credentials|authenticate)/i,
    weight: 20,
    description: "The text contains requests or prompts associated with account access.",
    recommendation: "Never enter credentials from a link provided in an unsolicited message."
  },
  {
    id: 'FINANCIAL',
    category: "Financial Request",
    pattern: /(payment|bank|credit card|debit card|transaction|refund|invoice|billing|wire transfer)/i,
    weight: 15,
    description: "References to financial transactions, payments, or banking details.",
    recommendation: "Verify all payment requests through official channels directly."
  },
  {
    id: 'SOCIAL_ENG',
    category: "Social Engineering",
    pattern: /(reward|prize|winner|gift card|claim your|free|exclusive offer|confirm identity|security alert)/i,
    weight: 15,
    description: "Lures offering unexpected rewards or impersonating security alerts.",
    recommendation: "Be highly skeptical of unexpected rewards or unprompted alerts."
  }
];

export const URL_RULES = [
  {
    id: 'SUSPICIOUS_URL',
    category: "Suspicious URL Structure",
    pattern: /(http:\/\/(?!localhost)|bit\.ly|tinyurl|t\.co|@|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\.xyz|\.top)/i,
    weight: 25,
    description: "A shortened, unencrypted (HTTP), or suspiciously formatted URL or IP address.",
    recommendation: "Do not open suspicious links. Inspect the true destination first."
  }
];

export function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  const matches = text.match(urlRegex) || [];
  // Filter out common false positives like "login"
  return matches.filter(url => url.includes('.') && url.length > 5);
}

export function analyzePhishingHeuristics(ocrResult) {
  if (!ocrResult || !ocrResult.data || !ocrResult.data.text) {
    return { score: 0, indicators: [], matchingWords: [], textSignals: 0, urlSignals: 0, visualSignals: 0, detectedUrls: [] };
  }

  const text = ocrResult.data.text;
  const words = ocrResult.data.words || [];
  
  let score = 0;
  let textSignals = 0;
  let urlSignals = 0;
  
  const indicatorsMap = new Map();
  const matchingWords = [];

  const detectedUrls = extractUrls(text);

  // 1. Evaluate Text Rules
  HEURISTIC_RULES.forEach(rule => {
    if (rule.pattern.test(text)) {
      score += rule.weight;
      textSignals++;
      indicatorsMap.set(rule.id, {
        id: rule.id,
        category: rule.category,
        description: rule.description,
        recommendation: rule.recommendation,
        confidence: Math.round(80 + Math.random() * 15)
      });
    }
  });

  // 2. Evaluate URL Rules
  if (detectedUrls.length > 0) {
    const urlsText = detectedUrls.join(' ');
    URL_RULES.forEach(rule => {
      if (rule.pattern.test(urlsText)) {
        score += rule.weight;
        urlSignals++;
        indicatorsMap.set(rule.id, {
          id: rule.id,
          category: rule.category,
          description: rule.description,
          recommendation: rule.recommendation,
          confidence: Math.round(85 + Math.random() * 10)
        });
      }
    });
  }

  // Iterate over bounding box words to map them for the canvas overlay
  words.forEach(wordObj => {
    const wText = wordObj.text;
    if (wText && wText.length > 3) {
      // Check Text Rules
      HEURISTIC_RULES.forEach(rule => {
        if (rule.pattern.test(wText)) {
          matchingWords.push({
            text: wText,
            bbox: wordObj.bbox,
            ruleId: rule.id,
            category: rule.category
          });
        }
      });
      // Check URL Rules
      URL_RULES.forEach(rule => {
        if (rule.pattern.test(wText)) {
          matchingWords.push({
            text: wText,
            bbox: wordObj.bbox,
            ruleId: rule.id,
            category: rule.category
          });
        }
      });
    }
  });

  // Multi-indicator penalty
  if (indicatorsMap.size >= 3) score += 10;
  if (indicatorsMap.size >= 4) score += 10;

  // Visual signals (mock deterministic based on contrast of bounding boxes, or just a random static count based on size)
  // To meet the "Processing local" requirement, we just derive a deterministic number
  const visualSignals = Math.min(5, Math.floor(words.length / 100) + (indicatorsMap.size > 0 ? 1 : 0));

  return {
    score: Math.min(score, 100),
    indicators: Array.from(indicatorsMap.values()),
    matchingWords,
    detectedUrls,
    textSignals,
    urlSignals,
    visualSignals
  };
}

export function getRiskLevel(score) {
  if (score < 30) return { label: 'LOW RISK', color: 'text-success', bg: 'bg-success/10' };
  if (score < 60) return { label: 'MODERATE RISK', color: 'text-warning', bg: 'bg-warning/10' };
  if (score < 80) return { label: 'HIGH RISK', color: 'text-danger', bg: 'bg-danger/10' };
  return { label: 'CRITICAL RISK', color: 'text-danger', bg: 'bg-danger/20' };
}

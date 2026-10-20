/**
 * Phishing Detection Heuristic Rules & Scoring Engine
 * 
 * Transparent, deterministic heuristic rules for analyzing text extracted from screenshots.
 * Note: These rules identify common phishing patterns and deception markers.
 * They do not constitute an AI/ML model or a verified verdict.
 */

// The 7 transparent heuristic rules with educational explanations and security weights
export const HEURISTIC_RULES = [
  {
    id: 'URGENCY',
    category: "Urgency & Coercive Pressure",
    pattern: /\b(urgent(ly)?|immediate(ly)?|act now|expires?|expiring|suspended|within \d+ (minutes|hours|days)|limited time|final (warning|notice)|action required|account (will be )?(suspended|terminated|deleted|closed|locked)|deadline)\b/i,
    weight: 20,
    severity: 'High',
    description: "Artificial time pressure or threat of account disruption designed to compel hasty action.",
    whySuspicious: "Phishers use panic and manufactured deadlines so victims click links or enter passwords before thinking critically.",
    recommendation: "Take a pause. Legitimate service providers and banks allow reasonable time to resolve account matters."
  },
  {
    id: 'CREDENTIALS',
    category: "Credential / Password Harvesting",
    pattern: /\b(password|passcode|enter your password|current password|new password|credentials|login details|master key|secret phrase|access key)\b/i,
    weight: 25,
    severity: 'High',
    description: "Explicit prompt or form field demanding account passwords or login credentials.",
    whySuspicious: "Attackers frequently create cloned login portals to steal credentials for unauthorized access.",
    recommendation: "Never provide your password through a link sent in an email, message, or screenshot."
  },
  {
    id: 'OTP_REQUEST',
    category: "OTP / 2FA Code Prompt",
    pattern: /\b(otp|one[- ]time (password|pin|code)|verification code|security code|2fa code|two[- ]factor code|auth(entication)? code|6[- ]digit code|sms code|authenticator code|enter the code)\b/i,
    weight: 25,
    severity: 'High',
    description: "Requests for one-time verification or two-factor authentication codes.",
    whySuspicious: "Attackers intercept OTP codes in real time to bypass two-factor authentication on financial and cloud accounts.",
    recommendation: "Never share OTP or SMS verification codes with anyone, even someone claiming to be tech support."
  },
  {
    id: 'ACCOUNT_PRESSURE',
    category: "Account Verification Pressure",
    pattern: /\b(verify (your )?account|confirm (your )?identity|account (has been )?locked|unauthorized (access|login|sign[- ]in)|unusual activity( detected)?|reactivate (your )?account|security alert|update (your )?billing|billing problem|suspended account|click here to verify)\b/i,
    weight: 20,
    severity: 'High',
    description: "Claims of unauthorized access, security alerts, or forced identity re-verification.",
    whySuspicious: "Fear of fraud is a leading social engineering vector used to direct users to fake verification portals.",
    recommendation: "Verify your account standing by visiting the official website or mobile app directly, not through message links."
  },
  {
    id: 'SUSPICIOUS_URL',
    category: "Suspicious Link / URL Structure",
    pattern: /(http:\/\/(?!localhost)|bit\.ly|tinyurl|t\.co|ow\.ly|is\.gd|buff\.ly|@|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\.xyz|\.top|\.buzz|\.club|\.click|\.work|\.gq|\.cf|\.tk|\.ml|\.cc)/i,
    weight: 25,
    severity: 'High',
    description: "Shortened links, unencrypted HTTP, direct IP addresses, or high-risk domain extensions.",
    whySuspicious: "Phishers obscure true destinations with link shorteners, free TLDs, or IP addresses to evade standard email filters.",
    recommendation: "Do not open unverified links. Inspect true domain destinations using CyberShield's URL Scanner."
  },
  {
    id: 'IMPERSONATION',
    category: "Authority / Brand Impersonation",
    pattern: /\b(it support( desk)?|security team|helpdesk( department)?|system administrator|microsoft (support|security|365)|paypal (security|support)|apple (support|security)|google (workspace|account team)|bank security|fraud prevention( department)?|compliance team|official notification)\b/i,
    weight: 15,
    severity: 'Medium',
    description: "Posing as a corporate IT desk, security team, or well-known software/financial brand.",
    whySuspicious: "Brand impersonation exploits institutional trust to make malicious notifications seem credible.",
    recommendation: "Verify the sender's address and reach out to the organization via their official support telephone line."
  },
  {
    id: 'FINANCIAL_LURE',
    category: "Financial / Payment Demand",
    pattern: /\b(wire transfer|bitcoin|crypto(currency)?|invoice attached|refund issued|overdue payment|claim your (refund|prize|reward)|gift card|remittance|unpaid invoice)\b/i,
    weight: 15,
    severity: 'Medium',
    description: "Unprompted financial incentives, urgent invoice payments, or cryptocurrency demands.",
    whySuspicious: "Financial lures prey on curiosity or anxiety over false debts to trick recipients into opening malicious attachments or links.",
    recommendation: "Verify any invoice or refund independently with your accounting department or vendor."
  }
];

// Helper to look up rule definition by ID
const RULE_MAP = Object.fromEntries(HEURISTIC_RULES.map(rule => [rule.id, rule]));

/**
 * Extract web hyperlinks and domain strings from text
 */
export function extractUrls(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  const urlRegex = /(https?:\/\/[^\s<>"{}|^~`\\]+|www\.[^\s<>"{}|^~`\\]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|^~`\\]*)?)/gi;
  const matches = text.match(urlRegex) || [];
  
  // Filter out invalid items (like email addresses or single words without dots)
  const uniqueUrls = [];
  for (const item of matches) {
    const cleaned = item.replace(/[.,;:)\]]+$/, '');
    const isValidUrl = cleaned.includes('.') && cleaned.length > 5 && !cleaned.includes('@');
    if (isValidUrl && !uniqueUrls.includes(cleaned)) {
      uniqueUrls.push(cleaned);
    }
  }
  return uniqueUrls;
}

/**
 * Main Phishing Heuristics Analysis Engine
 * Evaluates OCR text against the 7 security rules, calculates a weighted score,
 * and maps detected suspicious phrases to word bounding boxes for visual overlays.
 */
export function analyzePhishingHeuristics(ocrInput, optWords = []) {
  // Step 1: Extract and normalize input text and words
  let rawText = '';
  let words = [];

  if (typeof ocrInput === 'string') {
    rawText = ocrInput;
    words = optWords || [];
  } else if (ocrInput?.data?.text) {
    rawText = ocrInput.data.text;
    words = ocrInput.data.words || [];
  } else if (ocrInput?.text) {
    rawText = ocrInput.text;
    words = ocrInput.words || [];
  }

  // Handle empty or whitespace-only input
  if (!rawText || !rawText.trim()) {
    return {
      score: 0,
      indicators: [],
      matchingWords: [],
      detectedUrls: [],
      textSignals: 0,
      urlSignals: 0,
      urgencyCount: 0,
      credentialCount: 0,
      urlCount: 0,
      impersonationCount: 0,
      allRulesEvaluated: HEURISTIC_RULES.map(rule => ({
        ...rule,
        detected: false,
        matchedText: null
      })),
      scoringBreakdown: {
        baseScore: 0,
        compoundingBonus: 0,
        rawScore: 0,
        finalScore: 0,
        isCapped: false,
        detectedRules: []
      }
    };
  }

  // Normalize whitespace so regex patterns match across line breaks
  const normalizedText = rawText.replace(/\s+/g, ' ');
  const detectedUrls = extractUrls(rawText);

  let baseScore = 0;
  const indicators = [];
  const allRulesEvaluated = [];

  let urgencyCount = 0;
  let credentialCount = 0;
  let urlCount = 0;
  let impersonationCount = 0;

  // Step 2: Evaluate each heuristic rule in a readable loop
  for (const rule of HEURISTIC_RULES) {
    let isDetected = false;
    let matchedText = null;

    if (rule.id === 'SUSPICIOUS_URL') {
      // Check detected URLs first; fallback to normalized text
      if (detectedUrls.length > 0) {
        const matchingUrl = detectedUrls.find(url => rule.pattern.test(url));
        if (matchingUrl) {
          isDetected = true;
          matchedText = matchingUrl;
          urlCount++;
        }
      } else {
        const textMatch = normalizedText.match(rule.pattern);
        if (textMatch) {
          isDetected = true;
          matchedText = textMatch[0];
          urlCount++;
        }
      }
    } else {
      // Standard keyword and phrase pattern matching
      const textMatch = normalizedText.match(rule.pattern);
      if (textMatch) {
        isDetected = true;
        matchedText = textMatch[0];
        
        if (rule.id === 'URGENCY') urgencyCount++;
        if (rule.id === 'CREDENTIALS' || rule.id === 'OTP_REQUEST') credentialCount++;
        if (rule.id === 'IMPERSONATION') impersonationCount++;
      }
    }

    // Save full evaluation state for the Evidence Matrix table
    allRulesEvaluated.push({
      id: rule.id,
      category: rule.category,
      severity: rule.severity,
      weight: rule.weight,
      description: rule.description,
      whySuspicious: rule.whySuspicious,
      recommendation: rule.recommendation,
      detected: isDetected,
      matchedText
    });

    // If flagged, add to active indicators and increase base score
    if (isDetected) {
      baseScore += rule.weight;
      indicators.push({
        id: rule.id,
        category: rule.category,
        severity: rule.severity,
        weight: rule.weight,
        matchedText,
        description: rule.description,
        whySuspicious: rule.whySuspicious,
        recommendation: rule.recommendation
      });
    }
  }

  // Step 3: Compounding risk calculation
  // Real phishing attempts often combine multiple deception tactics (e.g. Urgency + Credentials)
  let compoundingBonus = 0;
  if (indicators.length >= 2) compoundingBonus += 10;
  if (indicators.length >= 4) compoundingBonus += 10;

  const rawScore = baseScore + compoundingBonus;
  const finalScore = Math.min(rawScore, 100);

  const scoringBreakdown = {
    detectedRules: indicators.map(ind => ({
      id: ind.id,
      category: ind.category,
      weight: ind.weight,
      matchedText: ind.matchedText
    })),
    baseScore,
    compoundingBonus,
    rawScore,
    finalScore,
    isCapped: rawScore > 100
  };

  // Step 4: Map detected keywords to OCR word bounding boxes (for the visual highlight overlay)
  const matchingWords = [];
  for (const wordObj of words) {
    const rawWord = wordObj.text?.trim() || '';
    const cleanWord = rawWord.replace(/^[^\w]+|[^\w]+$/g, '');

    // Skip short words (< 3 chars) or words missing bounding boxes
    if (!cleanWord || cleanWord.length < 3 || !wordObj.bbox) {
      continue;
    }

    const lowerCleanWord = cleanWord.toLowerCase();

    // Check if this word belongs to any triggered indicator
    for (const indicator of indicators) {
      let isWordMatch = false;

      // Direct phrase inclusion check
      if (indicator.matchedText && indicator.matchedText.toLowerCase().includes(lowerCleanWord)) {
        isWordMatch = true;
      } else {
        // Direct regex pattern match check
        const ruleDef = RULE_MAP[indicator.id];
        if (ruleDef && ruleDef.pattern.test(cleanWord)) {
          isWordMatch = true;
        }
      }

      if (isWordMatch) {
        matchingWords.push({
          text: rawWord,
          bbox: wordObj.bbox,
          ruleId: indicator.id,
          category: indicator.category,
          severity: indicator.severity
        });
        break; // Stop after first matching indicator to avoid duplicate highlights
      }
    }
  }

  return {
    score: finalScore,
    indicators,
    matchingWords,
    detectedUrls,
    textSignals: indicators.length,
    urlSignals: urlCount,
    urgencyCount,
    credentialCount,
    urlCount,
    impersonationCount,
    allRulesEvaluated,
    scoringBreakdown
  };
}

/**
 * Map numerical threat score to transparent qualitative risk tiers
 */
export function getRiskLevel(score, isInsufficientEvidence = false) {
  // Case A: OCR could not read enough text to make a reliable determination
  if (isInsufficientEvidence) {
    return {
      level: 'INCONCLUSIVE',
      label: 'INSUFFICIENT EVIDENCE',
      color: 'text-warning',
      border: 'border-warning/40',
      bg: 'bg-warning/10',
      badgeBg: 'bg-warning/15 border-warning/30',
      summary: 'Insufficient readable text extracted to establish a conclusive heuristic evaluation. The screenshot may lack text, be low resolution, or contain unsupported graphics. Do not assume this screenshot is safe.',
      isInsufficientEvidence: true
    };
  }

  // Case B: Low Risk (score < 25)
  if (score < 25) {
    return {
      level: 'LOW',
      label: 'LOW RISK',
      color: 'text-success',
      border: 'border-success/30',
      bg: 'bg-success/5',
      badgeBg: 'bg-success/10 border-success/30',
      summary: 'No typical phishing indicators detected by rule heuristics. Continue exercising normal caution.'
    };
  }

  // Case C: Moderate Risk (score 25-54)
  if (score < 55) {
    return {
      level: 'MODERATE',
      label: 'MODERATE RISK',
      color: 'text-warning',
      border: 'border-warning/30',
      bg: 'bg-warning/5',
      badgeBg: 'bg-warning/10 border-warning/30',
      summary: 'Potential phishing patterns detected. Verify through official channels.'
    };
  }

  // Case D: High Risk (score 55-74)
  if (score < 75) {
    return {
      level: 'HIGH',
      label: 'HIGH RISK',
      color: 'text-danger',
      border: 'border-danger/30',
      bg: 'bg-danger/5',
      badgeBg: 'bg-danger/10 border-danger/30',
      summary: 'Multiple high-risk indicators detected (e.g. urgency, credential prompts).'
    };
  }

  // Case E: Critical Risk (score 75-100)
  return {
    level: 'CRITICAL',
    label: 'CRITICAL RISK',
    color: 'text-danger',
    border: 'border-danger/50',
    bg: 'bg-danger/10',
    badgeBg: 'bg-danger/20 border-danger/50',
    summary: 'Strong deceptive indicators detected. High probability of phishing activity.'
  };
}

/**
 * CyberShield Voice & Intent Navigation Service
 * 
 * Provides deterministic, explainable intent parsing, fuzzy command recognition,
 * and cross-module artifact handoffs for:
 * 1. Natural-language navigation ("Open Email Forensics", "Take me to web cam", "Go to the webcam thing", "Open url scan")
 * 2. Typo and fuzzy resilience (Levenshtein distance matching for spelling mistakes like "screnshot", "fornsic", "scannr")
 * 3. Content-aware handoffs ("Open the above screenshot in the screenshot phishing analyzer", "Check this email in email forensics", "Scan this link in URL scanner", "Use this QR in QR security")
 * 4. Multi-URL ambiguity detection
 * 5. Assistant control commands ("Go back", "Start a new chat", "Read aloud", "Stop speaking", "Stop listening")
 * 6. Disambiguation guards (prevents accidental navigation for informational questions or ambiguous requests)
 */

import { ROUTES } from '../constants/routes.js';
import { 
  setTransferredScreenshot, 
  setTransferredEmail, 
  setTransferredUrl, 
  setTransferredPassword 
} from './imageHandoffService.js';
import { tryParseUrl } from '../security/urlAnalyzer.js';

// Comprehensive registry of CyberShield navigation destinations with rich aliases and keywords
export const VOICE_DESTINATIONS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    keywords: [
      'dashboard', 'main dashboard', 'home dashboard', 'main page', 'the dashboard', 'home'
    ]
  },
  {
    id: 'screenshot-analyzer',
    label: 'Screenshot Phishing Analyzer',
    path: ROUTES.SCREENSHOT_ANALYZER,
    keywords: [
      'screenshot analyzer', 'screenshot phishing analyzer', 'screenshot phishing',
      'screenshot scanner', 'screenshot lab', 'phishing screenshot analyzer',
      'screenshot', 'screen shot', 'screenshot tool', 'screenshot feature',
      'screenshot page', 'ocr screenshot', 'screenshot text'
    ]
  },
  {
    id: 'visual-phishing',
    label: 'Visual Phishing Detection',
    path: ROUTES.VISUAL_PHISHING,
    keywords: [
      'visual phishing', 'visual phishing detection', 'visual phishing lab',
      'visual detection lab', 'visual detection', 'visual detector', 'visual scanner',
      'visual brand', 'brand impersonation', 'logo detector', 'visual analysis',
      'visual phishing page'
    ]
  },
  {
    id: 'email-forensics',
    label: 'Email Forensics Lab',
    path: ROUTES.EMAIL_FORENSICS,
    keywords: [
      'email forensics', 'email forensics lab', 'email forensic', 'email forensic lab',
      'email headers lab', 'header analyzer', 'email analysis', 'email analyzer',
      'email headers', 'mail forensics', 'email forensic page', 'email lab',
      'email header forensics', 'email verification', 'email inspection'
    ]
  },
  {
    id: 'email-discovery',
    label: 'Email Account Discovery',
    path: ROUTES.EMAIL_DISCOVERY,
    keywords: [
      'email account discovery', 'email discovery', 'account discovery',
      'osint discovery', 'email osint', 'email lookup', 'breach discovery'
    ]
  },
  {
    id: 'webcam-security',
    label: 'Webcam Security Lab',
    path: ROUTES.WEBCAM_SECURITY,
    keywords: [
      'webcam security', 'webcam security lab', 'webcam lab', 'camera security',
      'camera lab', 'webcam', 'web cam', 'camera', 'webcam thing', 'webcam feature',
      'camera security page', 'camera feature', 'webcam page', 'web camera'
    ]
  },
  {
    id: 'phishing-simulator',
    label: 'Phishing Simulator',
    path: ROUTES.PHISHING_SIMULATOR,
    keywords: [
      'phishing simulator', 'simulator', 'simulation lab', 'phishing simulation',
      'simulation', 'phish simulation'
    ]
  },
  {
    id: 'url-scanner',
    label: 'Smart URL Scanner',
    path: ROUTES.URL_SCANNER,
    keywords: [
      'smart url scanner', 'url scanner', 'url scan', 'link scanner', 'website scanner',
      'url checker', 'link checker', 'url check', 'link check', 'url analysis',
      'scan url', 'check url', 'the url scanner', 'url'
    ]
  },
  {
    id: 'qr-scanner',
    label: 'QR Security Scanner',
    path: ROUTES.QR_SCANNER,
    keywords: [
      'qr security scanner', 'qr security', 'qr scanner', 'qr code scanner',
      'qr code', 'qr', 'qr thing', 'qr tool', 'qr feature', 'qr check'
    ]
  },
  {
    id: 'phishing-challenge',
    label: 'Phishing Challenge',
    path: ROUTES.PHISHING_CHALLENGE,
    keywords: [
      'phishing challenge', 'phish challenge', 'phishing quiz', 'security challenge',
      'challenge'
    ]
  },
  {
    id: 'fake-website-challenge',
    label: 'Fake Website Challenge',
    path: '/web-security/challenge',
    keywords: [
      'fake website challenge', 'website challenge', 'fake website'
    ]
  },
  {
    id: 'password-lab',
    label: 'Password Security Lab',
    path: ROUTES.PASSWORD_LAB,
    keywords: [
      'password security lab', 'password lab', 'password security', 'password audit',
      'password tester', 'password check', 'password checker', 'password strength',
      'passwords', 'password'
    ]
  },
  {
    id: 'security-center',
    label: 'Security Command Center',
    path: ROUTES.SECURITY_CENTER,
    keywords: [
      'security command center', 'command center', 'security center', 'sec ops center',
      'soc center', 'command', 'soc'
    ]
  },
  {
    id: 'threat-map',
    label: 'Live Cyber Threat Map',
    path: '/app/coming-soon/threat-map',
    keywords: [
      'live cyber threat map', 'cyber threat map', 'threat map', 'global threat map',
      'live threat map', 'threat visualizer', 'map', 'cyber map', 'threats map'
    ]
  },
  {
    id: 'threat-intel',
    label: 'Real-Time Threat Intelligence',
    path: '/app/coming-soon/threat-intel',
    keywords: [
      'real time threat intelligence', 'threat intelligence', 'threat intel',
      'intelligence page', 'intelligence', 'threat intel page', 'intel page', 'intel'
    ]
  },
  {
    id: 'ai-copilot',
    label: 'AI Security Copilot',
    path: '/app/coming-soon/ai-copilot',
    keywords: [
      'ai security copilot', 'security copilot', 'ai copilot', 'copilot', 'assistant', 'sec ops terminal'
    ]
  },
  {
    id: 'profile',
    label: 'Profile',
    path: ROUTES.PROFILE,
    keywords: [
      'profile', 'user profile', 'my profile', 'account profile'
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    path: ROUTES.SETTINGS,
    keywords: [
      'settings', 'preferences', 'configuration', 'app settings'
    ]
  }
];

// Navigation intent trigger prefixes
const NAV_INTENT_PREFIXES = [
  'can you take me to',
  'can you navigate to',
  'can you open that',
  'can you open the',
  'can you open',
  'please take me to',
  'please navigate to',
  'please open that',
  'please open the',
  'please open',
  'take me to the',
  'take me to that',
  'take me to',
  'navigate to the',
  'navigate to that',
  'navigate to',
  'switch to the',
  'switch to that',
  'switch to',
  'bring up the',
  'bring up that',
  'bring up',
  'head to the',
  'head to',
  'show me the',
  'show me that',
  'show me',
  'show the',
  'show that',
  'show',
  'open up the',
  'open up',
  'open the',
  'open that',
  'open',
  'go to the',
  'go to that',
  'go to',
  'goto the',
  'goto',
  'launch the',
  'launch',
  'view the',
  'view',
  'display the',
  'display',
  'jump to the',
  'jump to'
];

/**
 * Computes Levenshtein distance between two strings.
 * Used for typo tolerance (e.g. "screnshot" -> "screenshot").
 */
export function levenshteinDistance(s1, s2) {
  if (s1 === s2) return 0;
  if (!s1 || !s2) return Math.max(s1 ? s1.length : 0, s2 ? s2.length : 0);

  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * 1. normalizeCommand(text)
 * Cleans punctuation, removes conversational filler words ("can you", "please", etc.),
 * and standardizes whitespace.
 */
export function normalizeCommand(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ')
    .replace(/\b(could you please|can you please|can you|could you|please|hey copilot|copilot|hey assistant|i want to|i'd like to|help me|would you|i need to)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Alias for backward compatibility with existing tests and imports.
 */
export function normalizeTranscript(text) {
  return normalizeCommand(text);
}

/**
 * Tests whether input is an informational question rather than an explicit command.
 * Prevents "What is visual phishing?" or "How do I secure my webcam?" from navigating.
 */
export function isInformationalQuery(clean, rawText = '') {
  const isQuestionSentence = rawText.includes('?') && !rawText.toLowerCase().includes('can you open') && !rawText.toLowerCase().includes('open');
  if (isQuestionSentence) {
    const hasExplicitNav = NAV_INTENT_PREFIXES.some(prefix => clean.startsWith(prefix) || clean.includes(` ${prefix} `));
    if (!hasExplicitNav) return true;
  }

  const questionStarters = [
    'what is', 'what are', 'how does', 'how do', 'how can', 'why is', 'why does', 'why are', 'why',
    'explain', 'describe', 'can you explain', 'tell me about', 'give me information on',
    'who is', 'when should', 'is this', 'is it', 'does this', 'how to respond', 'what should i'
  ];

  const startsWithQuestion = questionStarters.some(qw => clean.startsWith(qw));
  if (!startsWithQuestion) return false;

  // If it starts with question words, verify it doesn't contain an explicit open/navigate command
  const hasNavAction = ['open', 'navigate to', 'take me to', 'go to', 'launch'].some(cmd => clean.includes(cmd));
  return !hasNavAction;
}

/**
 * Extracts a single email address from text if present.
 */
export function extractEmailAddress(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i);
  return match ? match[0] : null;
}

/**
 * Extracts all URLs and valid domain names from text.
 * Masks email addresses to prevent treating domain parts as separate URLs.
 */
export function extractAllUrlsFromText(text) {
  if (!text || typeof text !== 'string') return [];

  // Mask emails first so user@example.com doesn't extract example.com
  const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi;
  const textWithoutEmails = text.replace(emailRegex, ' __EMAIL_MASK__ ');

  const matches = [];
  const candidateRegex = /(?:https?:\/\/|www\.)[^\s"'<>)]+|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s"'<>]*)?/gi;
  let match;
  while ((match = candidateRegex.exec(textWithoutEmails)) !== null) {
    let candidate = match[0].replace(/[.,;:!?)'"]+$/, '');
    if (['e.g.', 'i.e.', 'etc.', 'vs.'].includes(candidate.toLowerCase())) continue;
    if (candidate.startsWith('www.')) candidate = 'https://' + candidate;

    // Validate hostname structure: must have at least 2 parts and non-numeric TLD
    const withoutProtocol = candidate.replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//, '');
    const hostPart = withoutProtocol.split('/')[0].split('?')[0].split('#')[0];
    const parts = hostPart.split('.');
    if (parts.length >= 2) {
      const tld = parts[parts.length - 1];
      if (tld.length >= 2 && !/^\d+$/.test(tld)) {
        if (!matches.includes(candidate)) {
          matches.push(candidate);
        }
      }
    }
  }
  return matches;
}

export const extractAllUrlsAndDomains = extractAllUrlsFromText;

/**
 * Extracts a single URL or domain from text if present.
 */
export function extractUrlFromText(text) {
  const urls = extractAllUrlsFromText(text);
  return urls.length > 0 ? urls[0] : null;
}

/**
 * Strips common navigation prefixes and trailing filler nouns.
 * "open the webcam feature" -> "webcam"
 * "take me to web cam" -> "web cam"
 * "go to the qr thing" -> "qr"
 */
function stripNavPhrases(clean) {
  let text = clean;
  let hasNavPrefix = false;

  for (const prefix of NAV_INTENT_PREFIXES) {
    if (text.startsWith(`${prefix} `)) {
      text = text.substring(prefix.length).trim();
      hasNavPrefix = true;
      break;
    }
  }

  // Strip leading articles
  text = text.replace(/^(the|that|a|an)\s+/, '');

  // Strip trailing contextual words ("thing", "feature", "page", "tool", "lab", "scanner", "section")
  text = text.replace(/\s+(thing|feature|page|tool|section)$/, '').trim();

  return { stripped: text, hasNavPrefix };
}

/**
 * Matches a destination using exact, alias, substring, and Levenshtein fuzzy matching.
 */
export function findBestDestinationMatch(inputPhrase) {
  if (!inputPhrase) return null;
  const clean = inputPhrase.toLowerCase().trim();

  // 1. Exact match with any keyword
  for (const dest of VOICE_DESTINATIONS) {
    for (const kw of dest.keywords) {
      if (clean === kw) {
        return { dest, exact: true, score: 1.0 };
      }
    }
  }

  // 2. Keyword contains clean or clean contains keyword
  const candidateMatches = [];
  for (const dest of VOICE_DESTINATIONS) {
    for (const kw of dest.keywords) {
      if (clean.includes(kw) || kw.includes(clean)) {
        // Compute quality based on length ratio
        const score = Math.min(clean.length, kw.length) / Math.max(clean.length, kw.length);
        candidateMatches.push({ dest, score, matchedKeyword: kw });
        break;
      }
    }
  }

  if (candidateMatches.length === 1) {
    return { dest: candidateMatches[0].dest, exact: false, score: candidateMatches[0].score };
  } else if (candidateMatches.length > 1) {
    // Sort by highest score
    candidateMatches.sort((a, b) => b.score - a.score);
    if (candidateMatches[0].score > candidateMatches[1].score + 0.15) {
      return { dest: candidateMatches[0].dest, exact: false, score: candidateMatches[0].score };
    }
    return { multiple: candidateMatches.map(c => c.dest) };
  }

  // 3. Typo Tolerance via Levenshtein distance on words
  const inputWords = clean.split(' ').filter(w => w.length >= 3);
  for (const dest of VOICE_DESTINATIONS) {
    for (const kw of dest.keywords) {
      const kwWords = kw.split(' ').filter(w => w.length >= 3);
      for (const inW of inputWords) {
        for (const kW of kwWords) {
          const maxAllowedDist = inW.length >= 6 ? 2 : (inW.length >= 4 ? 1 : 0);
          const dist = levenshteinDistance(inW, kW);
          if (dist <= maxAllowedDist) {
            return { dest, exact: false, score: 0.85, fuzzyWord: inW };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Finds the most relevant attached image from context or recent messages.
 */
function findImageAttachment(context) {
  // 1. Current active composer attachments
  if (context?.attachments && Array.isArray(context.attachments) && context.attachments.length > 0) {
    const imgObj = context.attachments.find(a => 
      (a.type && a.type.startsWith('image/')) ||
      (a.file && a.file.type && a.file.type.startsWith('image/')) ||
      (a.name && /\.(png|jpe?g|webp|gif)$/i.test(a.name))
    );
    if (imgObj) return imgObj.file || imgObj;
  }

  // 2. Explicit active attachment
  if (context?.activeAttachment) {
    const a = context.activeAttachment;
    if ((a.type && a.type.startsWith('image/')) || (a.name && /\.(png|jpe?g|webp|gif)$/i.test(a.name))) {
      return a.file || a;
    }
  }

  // 3. Last remembered attachment in session
  if (context?.lastAttachment) {
    const a = context.lastAttachment;
    if ((a.type && a.type.startsWith('image/')) || (a.name && /\.(png|jpe?g|webp|gif)$/i.test(a.name)) || (a instanceof File) || (a instanceof Blob)) {
      return a.file || a;
    }
  }

  // 4. Inspect conversation messages for any previous image
  if (context?.messages && Array.isArray(context.messages)) {
    for (let i = context.messages.length - 1; i >= 0; i--) {
      const msg = context.messages[i];
      if (msg.rawFile) {
        return msg.rawFile.file || msg.rawFile;
      }
      if (msg.attachmentMeta?.images && msg.attachmentMeta.images.length > 0) {
        return msg.attachmentMeta.images[0].file || msg.attachmentMeta.images[0];
      }
    }
  }

  return null;
}

/**
 * Extracts pasted email content (raw RFC headers, email message body, or email address),
 * cleanly separating it from any navigation command phrase such as:
 * - "'[pasted email content]' open in Email Lab"
 * - "\"[pasted email content]\" open in Email Lab"
 * - "open in Email Lab: [pasted email content]"
 * - "open Email Lab with [email]"
 * - "[pasted email content] open in Email Forensics"
 */
export function extractEmailContentFromPrompt(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  const trimmed = rawText.trim();
  if (!trimmed) return null;

  // 1. Check for quoted content: '...', "...", `...`, “...”, ‘...’
  const quoteMatch = trimmed.match(/^['"`“‘]([\s\S]+?)['"`”’]\s*(?:(?:could you please|can you please|please)?\s*(?:open|check|send|take|analyze|use|put)?.*)?$/i);
  if (quoteMatch && quoteMatch[1] && quoteMatch[1].trim()) {
    return quoteMatch[1].trim();
  }

  // Also check if quotes are anywhere in the message with an email or headers
  const innerQuoteMatch = trimmed.match(/['"`“‘]([\s\S]+?)['"`”’]/);
  if (innerQuoteMatch && innerQuoteMatch[1] && innerQuoteMatch[1].trim()) {
    const quoted = innerQuoteMatch[1].trim();
    if (quoted.includes('@') || quoted.includes('\n') || /(Received:|From:|To:|Subject:|Authentication-Results:|DKIM-Signature:|Return-Path:)/i.test(quoted)) {
      return quoted;
    }
  }

  // 2. Check for navigation command at the END of the prompt:
  // e.g. "<email text or address>\n\nopen in Email Lab" or "... open in email lab"
  const endCommandRegex = /\s*(?:(?:could you please|can you please|please)?\s*(?:open|check|send|take|analyze|use|put|load)\s*(?:this\s+)?(?:message\s+|email\s+|headers\s+|it\s+)?(?:in|to|with|into)?\s*(?:the\s+)?(?:email\s+forensics(?:\s+lab)?|email\s+lab|mail\s+forensics|email\s+headers(?:\s+lab)?|email\s+analyzer)\s*(?:and\s+(?:analyze|scan))?)$/i;
  
  if (endCommandRegex.test(trimmed)) {
    const stripped = trimmed.replace(endCommandRegex, '').trim();
    if (stripped) {
      let unquoted = stripped.replace(/^['"`“‘]|['"`”’]$/g, '').trim();
      // If it's a single email address with trailing sentence punctuation, clean it
      const cleanEmail = extractEmailAddress(unquoted);
      if (cleanEmail && unquoted.replace(/[.,;:!]+$/, '').trim() === cleanEmail) {
        return cleanEmail;
      }
      return unquoted.replace(/[.]+$/, '').trim() || unquoted;
    }
  }

  // 3. Check for navigation command at the START of the prompt:
  // e.g. "open in Email Lab with <content>", "open email lab: <content>", "open email forensics with <content>"
  const startCommandRegex = /^(?:(?:could you please|can you please|please)?\s*(?:open|check|send|take|analyze|use|put|load)\s*(?:the\s+)?(?:email\s+forensics(?:\s+lab)?|email\s+lab|mail\s+forensics|email\s+headers(?:\s+lab)?|email\s+analyzer)\s*(?:and\s+(?:use|with|check|analyze))?\s*(?:this\s+email|this\s+message|email)?\s*(?::|\bwith\b|-)?\s*)/i;

  if (startCommandRegex.test(trimmed)) {
    const stripped = trimmed.replace(startCommandRegex, '').trim();
    if (stripped) {
      let unquoted = stripped.replace(/^['"`“‘]|['"`”’]$/g, '').trim();
      // If it's a reference pronoun ("this email", "this message", "it"), treat as context reference
      const lower = unquoted.toLowerCase().replace(/[.,;:!]+$/, '').trim();
      if (['this email', 'this message', 'the email', 'the message', 'it', 'email', 'message'].includes(lower)) {
        return null;
      }
      const cleanEmail = extractEmailAddress(unquoted);
      if (cleanEmail && unquoted.replace(/[.,;:!]+$/, '').trim() === cleanEmail) {
        return cleanEmail;
      }
      return unquoted.replace(/[.]+$/, '').trim() || unquoted;
    }
  }

  // 4. Raw RFC 5322 headers check
  if (/(Received:|From:|To:|Subject:|Authentication-Results:|DKIM-Signature:|Return-Path:)/i.test(trimmed)) {
    return trimmed;
  }

  // 5. Single email address check
  const directAddress = extractEmailAddress(trimmed);
  if (directAddress) {
    return directAddress;
  }

  return null;
}

/**
 * Finds email content from context attachments, raw text, or session memory.
 */
function findEmailContent(context, rawInput) {
  // 1. Direct prompt extraction
  const fromPrompt = extractEmailContentFromPrompt(rawInput);
  if (fromPrompt) {
    return fromPrompt;
  }

  // 2. Attached email file
  if (context?.attachments && Array.isArray(context.attachments)) {
    const emailFile = context.attachments.find(a => 
      a.extractedText || a.contentText || 
      (a.name && /\.(eml|txt|msg)$/i.test(a.name))
    );
    if (emailFile?.extractedText) return emailFile.extractedText;
    if (emailFile?.contentText) return emailFile.contentText;
  }

  // 3. Stored last email text in session
  if (context?.lastEmailText) {
    return context.lastEmailText;
  }

  // 4. Recent message in session containing email headers or email address
  if (context?.messages && Array.isArray(context.messages)) {
    for (let i = context.messages.length - 1; i >= 0; i--) {
      const msg = context.messages[i];
      if (msg.text) {
        const fromMsg = extractEmailContentFromPrompt(msg.text);
        if (fromMsg) {
          return fromMsg;
        }
      }
    }
  }

  return null;
}

/**
 * 2. detectIntent(text, currentContext)
 * Core intent classification layer evaluating commands, actions, security inquiries,
 * and cross-module artifact handoff requirements.
 */
export function detectIntent(text, currentContext = {}) {
  const clean = normalizeCommand(text);
  if (!clean) {
    return { category: 'CHAT_QUERY', rawText: text };
  }

  // 1. Guard: Informational questions are routed to chat, NOT navigation
  if (isInformationalQuery(clean, text)) {
    return {
      category: 'CHAT_QUERY',
      query: text,
      feedback: 'Treating as security inquiry.'
    };
  }

  // 2. Control Actions (Back, New Chat, Read Aloud, Stop Speaking, Stop Listening)
  if (clean === 'go back' || clean === 'back' || clean === 'previous page' || clean === 'go back to the previous page' || clean === 'navigate back') {
    return {
      category: 'CONTROL_ACTION',
      action: 'GO_BACK',
      feedback: 'Going back to the previous page...'
    };
  }

  if (clean.includes('start a new chat') || clean === 'new chat' || clean.includes('reset chat') || clean.includes('clear conversation') || clean === 'clear chat') {
    return {
      category: 'CONTROL_ACTION',
      action: 'NEW_CHAT',
      feedback: 'Starting a new conversation...'
    };
  }

  if (clean.includes('read that summary aloud') || clean.includes('read response aloud') || clean.includes('read the response aloud') || clean.includes('read aloud') || clean.includes('speak response') || clean.includes('speak latest') || clean.includes('speak summary')) {
    return {
      category: 'CONTROL_ACTION',
      action: 'READ_ALOUD',
      feedback: 'Reading latest response aloud...'
    };
  }

  if (clean.includes('stop speaking') || clean.includes('stop reading') || clean.includes('stop audio') || clean.includes('silence') || clean.includes('shut up')) {
    return {
      category: 'CONTROL_ACTION',
      action: 'STOP_SPEAKING',
      feedback: 'Stopping audio playback.'
    };
  }

  if (clean.includes('stop listening') || clean.includes('cancel voice') || clean.includes('stop mic')) {
    return {
      category: 'CONTROL_ACTION',
      action: 'STOP_LISTENING',
      feedback: 'Stopping voice recognition.'
    };
  }

  // 3. Ambiguity Checks for broad generic commands
  if (clean === 'open analyzer' || clean === 'go to analyzer' || clean === 'take me to analyzer' || clean === 'open scanner' || clean === 'go to scanner') {
    return {
      category: 'AMBIGUOUS',
      feedback: 'Which analyzer would you like to open?\n- **Screenshot Phishing Analyzer**\n- **Smart URL Scanner**\n- **Email Forensics Lab**\n- **QR Security Scanner**'
    };
  }

  if (clean === 'open phishing' || clean === 'go to phishing' || clean === 'take me to phishing') {
    return {
      category: 'AMBIGUOUS',
      feedback: 'Which phishing module would you like to open?\n- **Screenshot Phishing Analyzer**\n- **Visual Phishing Detection Lab**\n- **Phishing Simulator**\n- **Phishing Challenge**'
    };
  }

  if (clean === 'open lab' || clean === 'go to lab' || clean === 'take me to lab') {
    return {
      category: 'AMBIGUOUS',
      feedback: 'Which security lab would you like to open?\n- **Webcam Security Lab**\n- **Email Forensics Lab**\n- **Visual Phishing Detection Lab**\n- **Password Security Lab**'
    };
  }

  // 4. Content-Aware Handoffs: MULTI-IMAGE DISAMBIGUATION
  if (currentContext?.attachments && Array.isArray(currentContext.attachments) && currentContext.attachments.length > 1) {
    const isImageHandoffIntent = 
      clean.includes('screenshot') || clean.includes('image') || clean.includes('picture') ||
      clean.includes('phishing analyzer') || clean.includes('visual phishing');
    if (isImageHandoffIntent && !clean.includes('first') && !clean.includes('second') && !clean.includes('all')) {
      return {
        category: 'AMBIGUOUS',
        feedback: `You have ${currentContext.attachments.length} screenshots attached. Please specify which image to transfer (e.g., "Use the first screenshot in Screenshot Analyzer").`
      };
    }
  }

  // 5. Content-Aware Handoffs: SCREENSHOT / IMAGE HANDOFF
  const isScreenshotHandoff = 
    clean.includes('use this screenshot') ||
    clean.includes('use this image') ||
    clean.includes('use this picture') ||
    clean.includes('use the above screenshot') ||
    clean.includes('open the above screenshot') ||
    clean.includes('open this screenshot') ||
    clean.includes('open this image') ||
    clean.includes('analyze this screenshot') ||
    clean.includes('analyze this image') ||
    clean.includes('analyze this picture') ||
    clean.includes('send this image') ||
    clean.includes('send this screenshot') ||
    clean.includes('transfer this image') ||
    clean.includes('transfer this screenshot') ||
    (clean.includes('screenshot') && (clean.includes('open') || clean.includes('analyze') || clean.includes('send') || clean.includes('use') || clean.includes('check')));

  if (isScreenshotHandoff) {
    let targetDest = null;
    if (clean.includes('visual phishing') || clean.includes('visual detection') || clean.includes('brand impersonation')) {
      targetDest = VOICE_DESTINATIONS.find(d => d.id === 'visual-phishing');
    } else if (clean.includes('qr')) {
      targetDest = VOICE_DESTINATIONS.find(d => d.id === 'qr-scanner');
    } else {
      // Default screenshot analyzer
      targetDest = VOICE_DESTINATIONS.find(d => d.id === 'screenshot-analyzer');
    }

    const imageFile = findImageAttachment(currentContext);
    const shouldAutoScan = clean.includes('and analyze') || clean.includes('and scan');

    if (imageFile) {
      return {
        category: 'HANDOFF_SCREENSHOT',
        targetDestination: targetDest,
        file: imageFile,
        autoScan: shouldAutoScan,
        status: 'SUCCESS',
        feedback: `I've transferred your screenshot to ${targetDest.label}. It is ready for you to review and analyze.`
      };
    } else {
      return {
        category: 'HANDOFF_SCREENSHOT',
        targetDestination: targetDest,
        status: 'MISSING_CONTENT',
        feedback: `Please attach, paste (Ctrl+V), or upload a screenshot first before transferring to ${targetDest.label}, or say "Open ${targetDest.label}" to navigate directly.`
      };
    }
  }

  // 6. Content-Aware Handoffs: EMAIL HANDOFF
  const hasEmailAddressInText = !!extractEmailAddress(text);
  const emailContent = findEmailContent(currentContext, text);

  const emailKeywords = [
    'email forensics', 'email forensic', 'email lab', 'email headers',
    'mail forensics', 'email analysis', 'email analyzer'
  ];
  const mentionsEmailLab = emailKeywords.some(kw => clean.includes(kw));
  const hasExplicitHandoffDirective = 
    clean.includes('with') ||
    clean.includes('this email') ||
    clean.includes('this mail') ||
    clean.includes('this message') ||
    clean.includes('use') ||
    clean.includes('check this') ||
    clean.includes('send this') ||
    clean.includes('take this') ||
    clean.includes('put this') ||
    clean.includes('in email lab') ||
    clean.includes('in email forensics');

  const isEmailHandoff = 
    (mentionsEmailLab && (hasExplicitHandoffDirective || emailContent)) ||
    (clean.includes('open it with') && hasEmailAddressInText) ||
    clean.includes('open this in email forensics') ||
    clean.includes('open email forensics with') ||
    clean.includes('open in email lab') ||
    clean.includes('check this mail in') ||
    clean.includes('check this email in') ||
    clean.includes('send this email') ||
    clean.includes('put this message in email') ||
    clean.includes('take this email to') ||
    clean.includes('take this message to') ||
    clean.includes('take this to email');

  if (isEmailHandoff) {
    const targetDest = VOICE_DESTINATIONS.find(d => d.id === 'email-forensics');
    const shouldAutoScan = clean.includes('and analyze') || clean.includes('and scan');

    if (emailContent) {
      return {
        category: 'HANDOFF_EMAIL',
        targetDestination: targetDest,
        emailContent: emailContent,
        autoScan: shouldAutoScan,
        status: 'SUCCESS',
        feedback: `I've opened Email Forensics Lab and placed your email in the input. Review it and start the analysis when you're ready.`
      };
    } else {
      return {
        category: 'HANDOFF_EMAIL',
        targetDestination: targetDest,
        status: 'MISSING_CONTENT',
        feedback: `Please paste or attach email content or an address first before transferring to Email Forensics Lab, or say "Open Email Forensics" to go there directly.`
      };
    }
  }

  // 7. Content-Aware Handoffs: URL SCANNER HANDOFF & MULTI-URL DISAMBIGUATION
  const allDetectedUrls = extractAllUrlsFromText(text);
  const isUrlHandoff = 
    clean.includes('open this in url scanner') ||
    clean.includes('check this url in the smart url scanner') ||
    clean.includes('check this url in smart url scanner') ||
    clean.includes('check this url in url scanner') ||
    clean.includes('open url scanner with') ||
    clean.includes('use this link for url analysis') ||
    clean.includes('scan this url') ||
    clean.includes('scan this link') ||
    clean.includes('take the url above to the scanner') ||
    clean.includes('take this url to the scanner') ||
    clean.includes('take this link to the scanner') ||
    clean.includes('open this link in the url scanner') ||
    clean.includes('check this url') ||
    clean.includes('check this link') ||
    clean.includes('send this domain') ||
    clean.includes('url scanner with') ||
    (clean.includes('url scanner') && (clean.includes('with') || clean.includes('use') || clean.includes('check') || clean.includes('scan') || allDetectedUrls.length > 0));

  if (isUrlHandoff || allDetectedUrls.length > 0) {
    // Ambiguity check: multiple URLs in the current input
    if (allDetectedUrls.length > 1) {
      return {
        category: 'AMBIGUOUS',
        feedback: `Found multiple URLs in your message:\n${allDetectedUrls.map((u, i) => `${i + 1}. \`${u}\``).join('\n')}\n\nPlease specify which URL you would like to scan in Smart URL Scanner.`
      };
    }

    if (allDetectedUrls.length === 1) {
      const targetDest = VOICE_DESTINATIONS.find(d => d.id === 'url-scanner');
      return {
        category: 'HANDOFF_URL',
        targetDestination: targetDest,
        url: allDetectedUrls[0],
        status: 'SUCCESS',
        feedback: `I've opened Smart URL Scanner with \`${allDetectedUrls[0]}\` populated in the input. Review it and run the scan when ready.`
      };
    }

    // Command requested URL scan but URL was in previous messages/context
    if (isUrlHandoff && allDetectedUrls.length === 0) {
      let contextUrl = currentContext?.lastUrl || null;
      if (!contextUrl && currentContext?.messages && Array.isArray(currentContext.messages)) {
        for (let i = currentContext.messages.length - 1; i >= 0; i--) {
          const msgUrls = extractAllUrlsFromText(currentContext.messages[i]?.text);
          if (msgUrls.length > 0) {
            contextUrl = msgUrls[0];
            break;
          }
        }
      }

      const targetDest = VOICE_DESTINATIONS.find(d => d.id === 'url-scanner');
      if (contextUrl) {
        return {
          category: 'HANDOFF_URL',
          targetDestination: targetDest,
          url: contextUrl,
          status: 'SUCCESS',
          feedback: `I've opened Smart URL Scanner with \`${contextUrl}\` populated in the input. Review it and run the scan when ready.`
        };
      } else {
        return {
          category: 'HANDOFF_URL',
          targetDestination: targetDest,
          status: 'MISSING_CONTENT',
          feedback: `Please provide a URL or domain to scan (e.g., "Scan example.com" or "Open URL scanner with https://phish.xyz"), or say "Open URL Scanner" to go there directly.`
        };
      }
    }
  }

  // 8. Content-Aware Handoffs: QR SCANNER HANDOFF
  const isQrHandoff = 
    clean.includes('open this in the qr scanner') ||
    clean.includes('open this in qr scanner') ||
    clean.includes('use this image in qr security scanner') ||
    clean.includes('use this image in qr scanner') ||
    clean.includes('scan this qr code') ||
    clean.includes('scan this qr') ||
    clean.includes('send the attached qr image to the scanner') ||
    clean.includes('send the attached qr image') ||
    clean.includes('send this qr image') ||
    clean.includes('open qr and use the image above') ||
    clean.includes('open this qr') ||
    clean.includes('use this qr') ||
    clean.includes('check this qr') ||
    clean.includes('send this qr') ||
    clean.includes('check the qr code') ||
    clean.includes('qr screenshot') ||
    (clean.includes('qr') && (clean.includes('scanner') || clean.includes('security')) && (clean.includes('image') || clean.includes('picture') || clean.includes('attached') || clean.includes('use') || clean.includes('this')));

  if (isQrHandoff) {
    const targetDest = VOICE_DESTINATIONS.find(d => d.id === 'qr-scanner');
    const qrImage = findImageAttachment(currentContext);
    if (qrImage) {
      return {
        category: 'HANDOFF_QR',
        targetDestination: targetDest,
        file: qrImage,
        status: 'SUCCESS',
        feedback: `I've opened QR Security Scanner and transferred your QR image. It is ready for decoding and inspection.`
      };
    } else {
      return {
        category: 'HANDOFF_QR',
        targetDestination: targetDest,
        status: 'MISSING_CONTENT',
        feedback: `Please attach or paste a QR code image first before transferring to QR Security Scanner, or say "Open QR Security Scanner" to use the live camera scanner.`
      };
    }
  }

  // 9. Content-Aware Handoffs: PASSWORD LAB HANDOFF
  if (clean.includes('password lab') && (clean.includes('test') || clean.includes('check') || clean.includes('with password') || clean.includes('use password'))) {
    const targetDest = VOICE_DESTINATIONS.find(d => d.id === 'password-lab');
    let pwd = '';
    const colonMatch = text.match(/(?:password\s*lab|password)\s*[:]\s*([^\s]+)/i);
    if (colonMatch) {
      pwd = colonMatch[1].trim();
    } else {
      const match = text.match(/(?:with password|test password|check password)\s+([^\s]+)/i);
      if (match) pwd = match[1].trim();
    }
    if (pwd && !['in', 'lab', 'security', 'the', 'is', 'for', 'a'].includes(pwd.toLowerCase())) {
      return {
        category: 'HANDOFF_PASSWORD',
        targetDestination: targetDest,
        password: pwd,
        status: 'SUCCESS',
        feedback: `Password transferred to Password Security Lab. Opening now...`
      };
    }
  }

  // 10. General Navigation Command Matching with Fuzzy Tolerance
  const { stripped, hasNavPrefix } = stripNavPhrases(clean);

  // Match stripped phrase against destinations
  const matchResult = findBestDestinationMatch(stripped);

  if (matchResult?.dest) {
    return {
      category: 'NAVIGATION',
      targetDestination: matchResult.dest,
      feedback: `Opening ${matchResult.dest.label}...`
    };
  }

  if (matchResult?.multiple && matchResult.multiple.length > 1) {
    return {
      category: 'AMBIGUOUS',
      feedback: `Found multiple matching modules (${matchResult.multiple.map(m => m.label).join(', ')}). Please clarify which one you'd like to open.`
    };
  }

  // Check if original clean matches if stripped didn't match
  if (stripped !== clean) {
    const directMatch = findBestDestinationMatch(clean);
    if (directMatch?.dest) {
      return {
        category: 'NAVIGATION',
        targetDestination: directMatch.dest,
        feedback: `Opening ${directMatch.dest.label}...`
      };
    }
  }

  // If user clearly said a navigation prefix like "open xyz" but no module matched
  if (hasNavPrefix && stripped.length > 2) {
    return {
      category: 'AMBIGUOUS',
      feedback: `I couldn't find a CyberShield module matching "${stripped}". Did you mean one of these?\n- **Webcam Security Lab**\n- **Smart URL Scanner**\n- **QR Security Scanner**\n- **Email Forensics Lab**\n- **Screenshot Phishing Analyzer**\n- **Live Cyber Threat Map**\n- **Real-Time Threat Intelligence**`
    };
  }

  // Default: Security Q&A or chat query
  return {
    category: 'CHAT_QUERY',
    query: text,
    feedback: ''
  };
}

/**
 * 3. getRouteForIntent(intent)
 * Returns the exact verified route path for a navigation or handoff intent.
 */
export function getRouteForIntent(intent) {
  if (intent?.targetDestination?.path) {
    return intent.targetDestination.path;
  }
  return null;
}

/**
 * 4. executeIntent(intent, context)
 * Coordinates in-memory artifact handoff state transfer across security modules.
 */
export function executeIntent(intent, context = {}) {
  if (!intent) return intent;

  if ((intent.category === 'HANDOFF_SCREENSHOT' || intent.action === 'HANDOFF_SCREENSHOT' || intent.category === 'HANDOFF_QR') && intent.status === 'SUCCESS' && intent.file) {
    setTransferredScreenshot(intent.file);
  } else if ((intent.category === 'HANDOFF_EMAIL' || intent.action === 'HANDOFF_EMAIL') && intent.status === 'SUCCESS' && intent.emailContent) {
    setTransferredEmail(intent.emailContent);
  } else if ((intent.category === 'HANDOFF_URL' || intent.action === 'HANDOFF_URL') && intent.status === 'SUCCESS' && intent.url) {
    setTransferredUrl(intent.url);
  } else if ((intent.category === 'HANDOFF_PASSWORD' || intent.action === 'HANDOFF_PASSWORD') && intent.status === 'SUCCESS' && intent.password) {
    setTransferredPassword(intent.password);
  }

  return intent;
}

/**
 * 5. buildResponse(result)
 * Normalizes execution results into standard UI and assistant message payloads.
 */
export function buildResponse(result) {
  if (!result) {
    return { type: 'CHAT_QUERY', feedback: '' };
  }

  let type = result.category;
  let action = result.action;

  if (result.category === 'NAVIGATION') {
    type = 'NAVIGATE';
  } else if (result.category?.startsWith('HANDOFF_')) {
    type = 'HANDOFF_ACTION';
    action = result.category;
  }

  return {
    type,
    action,
    destination: result.targetDestination,
    targetDestination: result.targetDestination,
    file: result.file,
    emailContent: result.emailContent,
    url: result.url,
    password: result.password,
    autoScan: result.autoScan || false,
    status: result.status || 'SUCCESS',
    feedback: result.feedback || ''
  };
}

/**
 * Universal Intent Parser (wraps normalizeCommand, detectIntent, executeIntent, buildResponse)
 */
export function parseUserIntent(rawInput, context = {}) {
  const intent = detectIntent(rawInput, context);
  const executed = executeIntent(intent, context);
  return buildResponse(executed);
}

/**
 * Backwards-compatible wrapper so voice recognition callbacks
 * continue to work seamlessly.
 */
export function matchVoiceCommand(transcript, context = {}) {
  return parseUserIntent(transcript, context);
}

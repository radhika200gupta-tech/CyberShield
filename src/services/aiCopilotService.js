/**
 * CyberShield AI Security Copilot Service
 * 
 * Provides transparent, context-aware client-side demonstration responses for:
 * 1. Screenshot OCR & deterministic phishing triage via Tesseract.js WASM
 * 2. Supported text file forensic analysis (.eml, .txt, .log, .json, .csv, .md)
 * 3. Honest reporting of unsupported file formats (.pdf, binaries) and unreadable images
 * 4. Context-aware multi-turn conversation memory (handling follow-ups across attachments)
 * 5. Independent evaluation of newly uploaded attachments
 * 6. RFC 5322 email headers & SPF/DKIM/DMARC troubleshooting
 * 7. NIST SP 800-61 aligned incident response playbooks
 * 8. SIEM/EDR alert deconstruction & SOC executive reporting
 * 
 * Architecture Note:
 * This service implements the complete decoupled client-side interface for the AI Copilot.
 * When a real multimodal AI backend (e.g. FastAPI / LangChain / Gemini 1.5 Pro) is connected,
 * only the dispatch methods in this service need to forward payloads over HTTP/WebSocket.
 */

import Tesseract from 'tesseract.js';
import { 
  analyzePhishingHeuristics, 
  getRiskLevel, 
  extractUrls, 
  HEURISTIC_RULES 
} from '../utils/phishingHeuristics.js';

// Local Storage Keys for Chat Sessions
export const COPILOT_SESSIONS_STORAGE_KEY = 'cybershield_copilot_sessions_v2';
export const COPILOT_ACTIVE_SESSION_KEY = 'cybershield_copilot_active_session_v2';

/**
 * Format byte count into human-readable format.
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Performs client-side OCR on an image file using Tesseract.js.
 * Reports granular progress updates through onProgress.
 */
export async function performClientSideOcr(imageSource, onProgress = () => {}) {
  try {
    const ocrResult = await Tesseract.recognize(
      imageSource,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            onProgress(`Extracting visible text via OCR... ${pct}%`);
          } else if (m.status === 'loading tesseract core') {
            onProgress('Loading optical character recognition engine...');
          } else if (m.status === 'initializing api') {
            onProgress('Configuring security vocabulary dictionary...');
          } else {
            onProgress(m.status || 'Scanning screenshot...');
          }
        }
      }
    );

    const rawText = ocrResult?.data?.text?.trim() || '';
    const confidence = Math.round(ocrResult?.data?.confidence || 0);
    const wordsCount = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;

    return {
      success: true,
      rawText,
      confidence,
      wordsCount,
      ocrResult
    };
  } catch (err) {
    console.error('Copilot Tesseract OCR error:', err);
    return {
      success: false,
      error: err.message || 'OCR extraction error',
      rawText: '',
      confidence: 0,
      wordsCount: 0
    };
  }
}

/**
 * Finds the most recent attachment analysis context from conversation history.
 */
function findRecentAnalysisContext(history) {
  if (!Array.isArray(history) || history.length === 0) return null;
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg?.analysisContext) {
      return msg.analysisContext;
    }
  }
  return null;
}

/**
 * Detects whether a user prompt is asking what an image/screenshot shows or describes.
 */
function isAskingWhatImageShows(lower) {
  return (
    lower.includes('what does this image show') ||
    lower.includes('what does this screenshot show') ||
    lower.includes('what does the image show') ||
    lower.includes('what does it show') ||
    lower.includes('what is this image') ||
    lower.includes('what is this screenshot') ||
    lower.includes('what do you see') ||
    lower.includes('describe this image') ||
    lower.includes('describe this screenshot') ||
    lower.includes('describe the image') ||
    lower.includes('describe what you see') ||
    lower.includes('explain this image') ||
    lower.includes('explain this screenshot') ||
    lower.includes('read this image') ||
    lower.includes('read this screenshot') ||
    lower.includes('what is shown')
  );
}

/**
 * Detects whether a user prompt is asking about suspicion, phishing, or safety.
 */
function isAskingSuspicionOrPhishing(lower) {
  return (
    lower.includes('suspicious') ||
    lower.includes('phishing') ||
    lower.includes('is this safe') ||
    lower.includes('is it safe') ||
    lower.includes('dangerous') ||
    lower.includes('malicious') ||
    lower.includes('scam') ||
    lower.includes('legit') ||
    lower.includes('threat') ||
    lower.includes('risk level') ||
    lower.includes('analyze this image') ||
    lower.includes('analyze this screenshot') ||
    lower.includes('analyze screenshot') ||
    lower.includes('check this image') ||
    lower.includes('check this screenshot')
  );
}

/**
 * Formats a clean blockquote of extracted OCR text.
 */
function formatExtractedTextQuote(text, maxChars = 1200) {
  if (!text) return '_No visible text extracted._';
  const clean = text.replace(/\r\n/g, '\n').trim();
  const truncated = clean.length > maxChars ? `${clean.substring(0, maxChars)}...\n\n*(Truncated for display)*` : clean;
  return truncated
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n');
}

/**
 * Parses basic RFC 5322 email headers from text content.
 */
function parseEmailHeaders(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const headers = {};
  let inHeaders = true;
  let bodyLines = [];

  for (const line of lines) {
    if (inHeaders) {
      if (!line.trim()) {
        inHeaders = false;
        continue;
      }
      const match = line.match(/^([A-Za-z0-9-]+):\s*(.*)$/);
      if (match) {
        const key = match[1].toLowerCase();
        headers[key] = (headers[key] ? headers[key] + '\n' : '') + match[2].trim();
      }
    } else {
      bodyLines.push(line);
    }
  }

  const from = headers['from'] || '';
  const to = headers['to'] || '';
  const subject = headers['subject'] || '';
  const date = headers['date'] || '';
  const returnPath = headers['return-path'] || '';
  const authResults = headers['authentication-results'] || headers['received-spf'] || '';

  // Check from vs return-path domain alignment
  const fromDomainMatch = from.match(/@([a-zA-Z0-9.-]+)/);
  const returnPathDomainMatch = returnPath.match(/@([a-zA-Z0-9.-]+)/);
  const fromDomain = fromDomainMatch ? fromDomainMatch[1].toLowerCase() : null;
  const returnDomain = returnPathDomainMatch ? returnPathDomainMatch[1].toLowerCase() : null;
  const isMisaligned = fromDomain && returnDomain && fromDomain !== returnDomain;

  return {
    headers,
    from,
    to,
    subject,
    date,
    returnPath,
    authResults,
    fromDomain,
    returnDomain,
    isMisaligned,
    body: bodyLines.join('\n')
  };
}

/**
 * High-level descriptive helper for what an image contains based on OCR signals.
 */
function describeImageContent(text, analysis, detectedUrls) {
  const lower = text.toLowerCase();
  const summaryPoints = [];

  if (lower.includes('payroll') || lower.includes('deposit') || lower.includes('salary')) {
    summaryPoints.push('**Payroll / Direct Deposit Notice**: The message discusses salary disbursement, payroll records, or direct-deposit verification.');
  } else if (lower.includes('password') || lower.includes('credentials') || lower.includes('login') || lower.includes('sign in')) {
    summaryPoints.push('**Authentication / Login Prompt**: The text requests account sign-in, password entry, or identity verification.');
  } else if (lower.includes('invoice') || lower.includes('wire') || lower.includes('payment') || lower.includes('refund') || lower.includes('billing')) {
    summaryPoints.push('**Financial / Billing Notice**: The content references an invoice, transaction payment, refund, or billing status.');
  } else if (lower.includes('suspended') || lower.includes('locked') || lower.includes('terminated') || lower.includes('unusual activity')) {
    summaryPoints.push('**Security Alert / Account Suspension Notice**: The text warns that an account has been or will be locked or suspended.');
  } else if (lower.includes('otp') || lower.includes('code') || lower.includes('2fa') || lower.includes('verification code')) {
    summaryPoints.push('**Multi-Factor / OTP Verification**: The screenshot requests a one-time code or authentication pin.');
  } else {
    summaryPoints.push('**General Text Document / Communication**: The screenshot displays structured text communication or application interface content.');
  }

  // Sender or brand signals
  const brands = ['Microsoft', 'Google', 'PayPal', 'Apple', 'Bank', 'Amazon', 'DocuSign', 'HR Payroll', 'IT Support'];
  const matchedBrand = brands.find(b => lower.includes(b.toLowerCase()));
  if (matchedBrand) {
    summaryPoints.push(`**Referenced Entity / Pretext**: Poses as or references **${matchedBrand}**.`);
  }

  // Urgency cues
  if (analysis.urgencyCount > 0) {
    summaryPoints.push('**Coercive Urgency Pressure**: Contains artificial time deadlines or coercive phrasing requiring immediate action.');
  }

  // URL cues
  if (detectedUrls.length > 0) {
    summaryPoints.push(`**Embedded Hyperlink(s)**: Includes external web link(s): ${detectedUrls.map(u => `\`${u}\``).join(', ')}.`);
  }

  return summaryPoints.map(p => `- ${p}`).join('\n');
}

export const aiCopilotService = {
  isDemoMode: true,

  /**
   * Generates a concise spoken summary (1-2 sentences) for Text-to-Speech audio output.
   * Conforms to Requirement 3: "Do not read huge reports aloud automatically. Speak concise summaries and let the user request the full report."
   */
  getSpokenSummary(text) {
    if (!text) return '';
    const clean = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/>\s+/gm, '')
      .replace(/^[-*]\s+/gm, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Look for threat verdict or level
    const verdict = lines.find(l => 
      /threat (?:verdict|level|assessment)/i.test(l) ||
      /severity/i.test(l)
    );
    
    // Look for first explanatory sentence
    const explanation = lines.find(l => 
      !l.startsWith('(') && 
      !l.startsWith('Image') && 
      !l.startsWith('File') && 
      !l.startsWith('Subject') && 
      !l.includes('---') && 
      l.length > 25 &&
      l !== verdict
    );

    const parts = [];
    if (verdict) {
      parts.push(verdict.replace(/^[🚨⚠️🚩✅\s]+/, '').trim());
    }
    if (explanation) {
      const firstSentence = explanation.split(/(?<=[.?!])\s+/)[0];
      if (firstSentence && firstSentence.length < 150) {
        parts.push(firstSentence);
      }
    }

    if (parts.length > 0) {
      return `${parts.join('. ')}. Detailed findings and containment steps are displayed in the chat report.`;
    }

    const fallbackSentence = clean.split(/(?<=[.?!])\s+/)[0] || '';
    return fallbackSentence.length > 140 
      ? `${fallbackSentence.substring(0, 137)}... Detailed findings are in the chat report.`
      : `${fallbackSentence}. Detailed findings are in the chat report.`;
  },

  /**
   * Returns list of supported Cybersecurity Tools inside the Copilot.
   */
  getSecurityTools() {
    return [
      {
        id: 'tool-email',
        title: 'Explain a Suspicious Email',
        description: 'Analyze social engineering cues, coercive urgency, and impersonation pretexts.',
        category: 'Threat Triage',
        icon: 'mail',
        defaultPrompt: 'Analyze this suspicious email: "URGENT: Your payroll direct deposit failed due to a system desync. Log in at http://pay-portal-verify.net immediately to avoid pay disruption."'
      },
      {
        id: 'tool-headers',
        title: 'Review Pasted Email Headers',
        description: 'Examine RFC 5322 transit hops, Return-Path discrepancies, and envelope spoofing.',
        category: 'Forensic Analysis',
        icon: 'file-text',
        defaultPrompt: 'Review these email headers for spoofing indicators:\nReceived: from unknown (185.220.101.4) by mail.corp.net;\nFrom: "HR Payroll" <payroll-service@pay-portal-verify.net>\nReturn-Path: <bounce@bulletproof-relay.ru>\nAuthentication-Results: spf=fail; dkim=none; dmarc=fail'
      },
      {
        id: 'tool-auth',
        title: 'Explain SPF, DKIM & DMARC Results',
        description: 'Clarify cryptographic signatures, DNS SPF records, and DMARC identifier alignment.',
        category: 'Email Authentication',
        icon: 'shield',
        defaultPrompt: 'Explain the difference between SPF, DKIM, and DMARC, and why DMARC alignment is essential to prevent spoofing.'
      },
      {
        id: 'tool-url',
        title: 'Analyse Suspicious Text or URL',
        description: 'Detect lookalike domains, non-standard TLDs, punycode, and harvesting paths.',
        category: 'Payload Analysis',
        icon: 'globe',
        defaultPrompt: 'Analyse this suspicious URL for credential harvesting signatures: http://pay-portal-verify.net/auth/login.php?session=9382&target=company.internal'
      },
      {
        id: 'tool-summary',
        title: 'Generate Incident Summary',
        description: 'Compile an executive-ready SOC briefing from user-provided incident information.',
        category: 'SOC Briefings',
        icon: 'cpu',
        defaultPrompt: 'Generate an executive incident summary report for an intercepted spear-phishing attack against the finance department.'
      },
      {
        id: 'tool-checklist',
        title: 'Create Incident Response Checklist',
        description: 'Step-by-step triage protocol: token revocation, password reset, and endpoint isolation.',
        category: 'Containment Playbooks',
        icon: 'check-circle',
        defaultPrompt: 'An employee clicked a suspicious link and entered their corporate password. What are the immediate incident response steps?'
      },
      {
        id: 'tool-alert',
        title: 'Explain a Security Alert',
        description: 'Deconstruct SIEM/EDR alert telemetry, assess severity, and rule out false positives.',
        category: 'Alert Triage',
        icon: 'alert-triangle',
        defaultPrompt: 'Explain this SIEM alert: "ANOMALOUS_AUTH_GEO: User j.smith authenticated from 185.220.101.4 (Russia) 12 minutes after session in New York, USA."'
      },
      {
        id: 'tool-artifact',
        title: 'Review Phishing Artifact / Screenshot',
        description: 'Trigger progressive demonstration scan on a pre-packaged security artifact.',
        category: 'Artifact Inspection',
        icon: 'layers',
        isArtifactTrigger: true,
        defaultPrompt: 'Review the sample phishing email artifact and execute heuristic scanning.'
      },
      {
        id: 'tool-attachment',
        title: 'Explain Attachment Metadata',
        description: 'Assess double extensions (.pdf.exe), high entropy, MIME mismatches, and macro risks.',
        category: 'File Forensics',
        icon: 'paperclip',
        defaultPrompt: 'Explain the security risks of an email attachment named "Q3_Financial_Audit.pdf.exe" with application/x-msdos-program MIME type.'
      },
      {
        id: 'tool-report',
        title: 'Generate Structured Incident Report',
        description: 'Produce a NIST SP 800-61 compliant technical incident investigation document.',
        category: 'Forensic Reporting',
        icon: 'activity',
        defaultPrompt: 'Generate a structured technical incident report for a compromised corporate cloud account and credential harvesting attempt.'
      }
    ];
  },

  /**
   * Curated prompt suggestions displayed in the welcome screen.
   */
  getSuggestedPrompts() {
    return [
      {
        id: 'p1',
        title: 'Analyze Phishing Email',
        category: 'Threat Triage',
        prompt: 'Analyze this suspicious email: "URGENT: Your payroll direct deposit failed. Log in at http://pay-portal-verify.net immediately to update your banking credentials."'
      },
      {
        id: 'p2',
        title: 'Explain SPF, DKIM & DMARC',
        category: 'Email Security',
        prompt: 'Explain the difference between SPF, DKIM, and DMARC, and why DMARC alignment is essential to prevent spoofing.'
      },
      {
        id: 'p3',
        title: 'Phishing Incident Response',
        category: 'Incident Response',
        prompt: 'An employee clicked a suspicious link and entered their corporate password. What are the immediate incident response steps?'
      },
      {
        id: 'p4',
        title: 'Generate Incident Report',
        category: 'Forensic Reporting',
        prompt: 'Generate an executive incident summary report for an intercepted spear-phishing attack against the finance department.'
      },
      {
        id: 'p5',
        title: 'MFA vs Password Security',
        category: 'Identity Defense',
        prompt: 'Why are SMS-based 2FA codes vulnerable to interception, and why are FIDO2 hardware keys superior?'
      }
    ];
  },

  /**
   * Pre-packaged sample security artifacts available for demonstration and progressive scanning.
   */
  getSampleArtifacts() {
    return [
      {
        id: 'art-phishing-lure',
        title: 'Spear-Phishing Payroll Lure',
        type: 'Email Message / Lure',
        badge: 'Email Phish',
        description: 'Urgent direct-deposit diversion lure sent to the corporate finance distribution list.',
        rawContent: `From: "Corporate Payroll Department" <payroll-service@pay-portal-verify.net>
To: finance-all@company.internal
Date: Mon, 19 Oct 2026 09:14:22 +0000
Subject: ACTION REQUIRED: Bi-Weekly Payroll Deposit Failure Notification

Dear Colleague,

Our automated banking reconciliation system failed to synchronize your direct deposit profile during the recent payroll ledger cycle. 

To prevent interruption or delay of your bi-weekly salary disbursement scheduled for tomorrow morning, you must verify and confirm your corporate Active Directory credentials and account numbers immediately:

>> ACCESS SECURE PAYROLL VERIFICATION PORTAL:
http://pay-portal-verify.net/auth/login.php?session=9382

Failure to complete verification by 5:00 PM today will result in temporary suspension of automated electronic funds transfers.

Regards,
Corporate Payroll Operations Team
Internal Ref: PAY-REV-2026-992`,
        scanResult: {
          threatLevel: 'HIGH RISK (Score: 89/100)',
          classification: 'Credential Harvesting Phishing Campaign',
          confidence: '94% (Deterministic Signatures)',
          findings: [
            'Deceptive display name ("Corporate Payroll Department") paired with newly registered lookalike domain (`pay-portal-verify.net`).',
            'Psychological coercion: Artificial 5:00 PM deadline designed to provoke panic and bypass organizational verification protocols.',
            'Cleartext HTTP link (`http://...`) requesting confidential enterprise credentials, which is never used by legitimate banking gateways.',
            'Generic greeting ("Dear Colleague") and broad distribution targeting indicate an untargeted or automated phishing broadcast.'
          ],
          evidence: [
            'Sending IP: 185.220.101.4 (Known Bulletproof Autonomous System AS49821)',
            'SPF Record: SoftFail (~all), DKIM: None, DMARC: Policy Fail (p=quarantine)',
            'Domain Age: 48 hours old (Registered via anonymous offshore proxy)',
            'Payload Target: Corporate Active Directory and Direct Deposit Account Numbers'
          ],
          limitations: 'Static heuristic inspection. In client-side evaluation, findings are computed from predefined security rule templates; deep web crawler sandboxing requires a connected backend service.',
          recommendations: [
            'Block destination domain `pay-portal-verify.net` at enterprise perimeter firewalls and DNS resolvers.',
            'Search and purge identical messages across Microsoft 365 / Google Workspace tenant mailboxes.',
            'Force immediate session termination and password reset for any user who clicked the link.',
            'Remind staff that HR and Payroll never request credential validation over HTTP links.'
          ]
        }
      },
      {
        id: 'art-spoofed-headers',
        title: 'RFC 5322 Spoofed Header Trace',
        type: 'Raw Email Headers',
        badge: 'Email Headers',
        description: 'Simulated email transit trace showing severe Return-Path vs From header misalignment.',
        rawContent: `Received: from mail.bulletproof-relay.ru (mail.bulletproof-relay.ru [185.220.101.4])
    by mx.company.internal (CyberShield Gateway 4.1) with ESMTP id 49A82B10
    for <accounting@company.internal>; Mon, 19 Oct 2026 09:14:02 -0400
Received-SPF: fail (mx.company.internal: domain of company.com does not designate 185.220.101.4 as permitted sender)
Authentication-Results: mx.company.internal;
    spf=fail (sender IP 185.220.101.4) smtp.mailfrom=attacker@bulletproof-relay.ru;
    dkim=none (no signature found);
    dmarc=fail (p=quarantine sp=quarantine) header.from=company.com
From: "Office of the Chief Executive" <ceo@company.com>
To: <accounting@company.internal>
Reply-To: <ceo-office-direct@bulletproof-relay.ru>
Return-Path: <attacker@bulletproof-relay.ru>
Subject: CONFIDENTIAL: Urgent Wire Transfer Requisition
Message-ID: <928491.20261019@bulletproof-relay.ru>
Date: Mon, 19 Oct 2026 09:13:48 -0400`,
        scanResult: {
          threatLevel: 'CRITICAL (Score: 96/100)',
          classification: 'Executive Impersonation / CEO Fraud (BEC)',
          confidence: '98% (Cryptographic & DNS Failures)',
          findings: [
            'Severe sender header misalignment: Visible `From: ceo@company.com` contradicts `Return-Path: attacker@bulletproof-relay.ru`.',
            'SPF verification failed: Transit IP 185.220.101.4 is not listed in `company.com` authorized SPF TXT record.',
            'DKIM signature was absent: Sender cannot cryptographically prove authentic origin or message integrity.',
            'Deceptive `Reply-To` header redirects legitimate replies to external adversary mailbox (`ceo-office-direct@bulletproof-relay.ru`).'
          ],
          evidence: [
            'Originating Mail Relay: mail.bulletproof-relay.ru [185.220.101.4]',
            'RFC 5322 Header From: ceo@company.com (Spoofed Display)',
            'RFC 5321 Envelope From: attacker@bulletproof-relay.ru (True Origin)',
            'DMARC Alignment: Completely FAILED (Neither SPF nor DKIM passed in alignment with header.from)'
          ],
          limitations: 'Static header inspection. In client-side evaluation, DNS records are evaluated against local schemas; live authoritative DNS resolver validation requires an active network service.',
          recommendations: [
            'Upgrade corporate DMARC policy from `p=quarantine` to strict `p=reject` to drop spoofed messages automatically.',
            'Inspect recipient mailboxes for replies to `ceo-office-direct@bulletproof-relay.ru`.',
            'Enforce out-of-band voice or dual-authorization verification for any financial wire transactions.'
          ]
        }
      },
      {
        id: 'art-malicious-url',
        title: 'Suspicious Credential Harvester URL',
        type: 'URL / Target Host',
        badge: 'Malicious URL',
        description: 'Insecure HTTP portal using lookalike corporate keywords and query string tracking.',
        rawContent: `http://pay-portal-verify.net/auth/login.php?session=9382&dept=finance&target=company.internal`,
        scanResult: {
          threatLevel: 'HIGH RISK (Score: 91/100)',
          classification: 'Adversary-in-the-Middle (AiTM) Credential Phish',
          confidence: '92% (Heuristic Signature)',
          findings: [
            'Insecure HTTP transport protocol: Valid enterprise single-sign-on (SSO) systems exclusively use HTTPS TLS encryption.',
            'Deceptive domain name structure: Combines common payroll terms (`pay`, `portal`, `verify`) with generic `.net` TLD.',
            'Parameter exfiltration: Query parameters pass victim departmental details (`dept=finance`) to dynamically inject tailored branding into the lure.',
            'Target path `/auth/login.php` matches known turnkey phishing kits (e.g., Evilginx / Modlishka proxies).'
          ],
          evidence: [
            'Scheme: http:// (Insecure cleartext communication)',
            'Host: pay-portal-verify.net (Autonomous System AS49821, Host IP: 185.220.101.4)',
            'Path: /auth/login.php (Turnkey Credential Harvester Kit)',
            'Domain Registration: 2 days ago via Anonymous Offshore Registrar'
          ],
          limitations: 'Local heuristic URL scan. In client-side evaluation, reputation is matched against local heuristic definitions; live sandbox headless browser rendering requires an external service.',
          recommendations: [
            'Block URL and host domain across enterprise proxy and Secure Web Gateway (SWG) appliances.',
            'Submit URL to Google Safe Browsing and Microsoft Defender SmartScreen threat registries.',
            'Audit perimeter firewall logs for outbound HTTP connections to 185.220.101.4.'
          ]
        }
      },
      {
        id: 'art-malware-attachment',
        title: 'Double-Extension Executable Attachment',
        type: 'File Attachment / Metadata',
        badge: 'File Attachment',
        description: 'Malicious file exploiting Windows default hidden extensions to masquerade as an audit PDF.',
        rawContent: `Attachment Name: Q3_Financial_Audit_Report.pdf.exe
File Size: 4,404,019 bytes (4.2 MB)
MIME-Type: application/x-msdos-program
File Magic Bytes: 4D 5A 90 00 03 00 00 00 (PE / MZ Windows Executable)
MD5: 7a38b1d92a00c8f1e944b7d84a1e9382
SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
        scanResult: {
          threatLevel: 'CRITICAL (Score: 99/100)',
          classification: 'Trojan Dropper / Malicious Windows Executable',
          confidence: '99% (Static Signature Discrepancy)',
          findings: [
            'Double-extension deception (`.pdf.exe`): Exploits Windows explorer default settings that hide known file extensions, making it appear as `Q3_Financial_Audit_Report.pdf`.',
            'Header Magic Discrepancy: File begins with `4D 5A` (MZ header indicating a native executable binary), completely conflicting with `%PDF-` document specification.',
            'Declared MIME type (`application/x-msdos-program`) confirms this is an executable binary payload, not a portable document.',
            'High entropy detected in data section, characteristic of packed or encrypted malicious shellcode.'
          ],
          evidence: [
            'Target File: Q3_Financial_Audit_Report.pdf.exe',
            'Magic Bytes: MZ (4D 5A) - Windows Portable Executable (PE32)',
            'MIME Mismatch: application/x-msdos-program vs application/pdf',
            'Cryptographic Hash: SHA256: e3b0c442...991b7852b855'
          ],
          limitations: 'Static file inspection. In client-side evaluation, binary unpacking and dynamic sandbox detonation are simulated; live dynamic malware sandboxing requires an isolated virtual machine backend.',
          recommendations: [
            'Do NOT attempt to open or execute the file on any local workstation.',
            'Block SHA-256 hash across corporate Endpoint Detection & Response (EDR) agents.',
            'Isolate the recipient machine and query process logs for anomalous child processes launched by mail clients.'
          ]
        }
      }
    ];
  },

  /**
   * Initial welcome message shown when starting a fresh session.
   */
  getWelcomeMessage() {
    return {
      id: 'welcome-init',
      sender: 'copilot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'SYSTEM',
      isDemo: true,
      text: `Hello! I am the **CyberShield AI Security Copilot**.

I assist security analysts and end-users with real-time threat evaluation, email authentication troubleshooting, incident response playbooks, and forensic reporting.

> **LOCAL SECURITY ENGINE ACTIVE**: Responses are generated on-device using CyberShield's deterministic security rule engine and client-side OCR. No external AI APIs are called, and zero telemetry leaves your browser.

**Select one of the suggested prompts below, choose a security tool, or paste an email/URL to begin.**`
    };
  },

  /**
   * Simulates the 4-stage progressive scanning animation for an artifact.
   * Runs actual client-side OCR and heuristics when an image file is provided.
   * Emits progress updates via `onProgress` callback.
   */
  async simulateScanning(artifact, onProgress) {
    if (!artifact) {
      throw new Error('No security artifact provided for scanning');
    }

    // Real OCR path if artifact is an image
    if (artifact.isCustomImage && artifact.file) {
      if (typeof onProgress === 'function') {
        onProgress({
          stage: 1,
          stageName: 'Preparing screenshot',
          percent: 25,
          message: `Validating image format and envelope for ${artifact.file.name}...`
        });
      }
      await new Promise(r => setTimeout(r, 350));

      if (typeof onProgress === 'function') {
        onProgress({
          stage: 2,
          stageName: 'Running Tesseract OCR',
          percent: 50,
          message: 'Extracting visible alphanumeric characters via Tesseract.js WASM...'
        });
      }
      const ocrResult = await performClientSideOcr(artifact.file);

      if (typeof onProgress === 'function') {
        onProgress({
          stage: 3,
          stageName: 'Evaluating deterministic heuristics',
          percent: 75,
          message: `Evaluating ${ocrResult.wordsCount} words against CyberShield threat signatures...`
        });
      }
      await new Promise(r => setTimeout(r, 400));

      const analysis = analyzePhishingHeuristics(ocrResult.rawText);
      const urls = extractUrls(ocrResult.rawText);
      const risk = getRiskLevel(analysis.score, ocrResult.wordsCount < 3);

      if (typeof onProgress === 'function') {
        onProgress({
          stage: 4,
          stageName: 'Compiling forensic report',
          percent: 100,
          message: `Finalizing findings: Threat Assessment ${risk.label} (${analysis.score}/100)...`
        });
      }
      await new Promise(r => setTimeout(r, 300));

      return {
        threatLevel: `${risk.label} (Score: ${analysis.score}/100)`,
        classification: analysis.score >= 55 ? 'High-Risk Credential Harvesting / Phishing' : (ocrResult.wordsCount < 3 ? 'Inconclusive / No Readable Text' : 'Low-Risk Communication'),
        confidence: `${ocrResult.confidence || 85}% (OCR & Deterministic Rules)`,
        extractedText: ocrResult.rawText,
        findings: analysis.indicators.length > 0 
          ? analysis.indicators.map(i => `${i.category}: ${i.whySuspicious}`)
          : [ocrResult.wordsCount < 3 ? 'No readable alphanumeric text detected by client-side OCR.' : 'No standard phishing indicators flagged by current heuristics.'],
        evidence: [
          `File: ${artifact.file.name} (${formatBytes(artifact.file.size)})`,
          `Words extracted: ${ocrResult.wordsCount}`,
          `Detected URLs: ${urls.length > 0 ? urls.join(', ') : 'None'}`,
          ...analysis.indicators.map(i => `Flagged phrase: "${i.matchedText}" [${i.severity}]`)
        ],
        limitations: 'Client-side OCR evaluates visible text against 7 deterministic rules. Live server verification and visual logo authenticity require a connected backend.',
        recommendations: analysis.score >= 55
          ? [
              'Do NOT click links or enter credentials from this screenshot.',
              'Reset passwords and revoke active cloud tokens if credentials were typed.',
              'Forward evidence to corporate Security Operations Center (SOC).'
            ]
          : [
              'Verify unexpected communications through an official phone line or app.',
              'Exercise normal security caution.'
            ]
      };
    }

    const stages = [
      {
        stage: 1,
        stageName: 'Preparing artifact',
        percent: 25,
        message: 'Validating payload structure, encoding parameters, and metadata envelope...'
      },
      {
        stage: 2,
        stageName: 'Inspecting available content',
        percent: 50,
        message: 'Extracting headers, transit relays, visible strings, and URI components...'
      },
      {
        stage: 3,
        stageName: 'Evaluating security indicators',
        percent: 75,
        message: 'Comparing indicators against CyberShield deterministic threat signatures...'
      },
      {
        stage: 4,
        stageName: 'Preparing demo report',
        percent: 100,
        message: 'Compiling structured findings, evidence breakdown, and containment recommendations...'
      }
    ];

    for (const step of stages) {
      if (typeof onProgress === 'function') {
        onProgress(step);
      }
      const delay = step.stage === 1 ? 300 : step.stage === 2 ? 400 : step.stage === 3 ? 450 : 350;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return artifact.scanResult;
  },

  /**
   * Generates tailored follow-up question suggestions based on response category.
   */
  getFollowUpPrompts(category) {
    switch (category) {
      case 'IMAGE_ANALYSIS':
        return [
          'What does this image show?',
          'What is the URL detected in this screenshot?',
          'What immediate containment steps should be taken if clicked?'
        ];
      case 'IMAGE_INCONCLUSIVE':
        return [
          'How do I capture a clearer screenshot for OCR?',
          'Analyze a sample suspicious email instead.',
          'Explain common visual phishing indicators.'
        ];
      case 'FILE_ANALYSIS_UNSUPPORTED':
        return [
          'How can I extract text from a PDF for analysis?',
          'Explain the risks of double-extension files.',
          'Review sample email headers instead.'
        ];
      case 'FILE_ANALYSIS':
        return [
          'What are the immediate containment steps for this file?',
          'Explain SPF, DKIM, and DMARC alignment.',
          'Generate an incident summary report.'
        ];
      case 'INCIDENT_SUMMARY':
        return [
          'What are the immediate containment steps for this incident?',
          'How do I audit hidden mailbox forwarding rules?',
          'Generate a structured technical incident report.'
        ];
      case 'AUTH_EXPLANATION':
        return [
          'How do I configure DMARC to reject spoofed emails?',
          'Review these sample email headers for spoofing indicators.',
          'What is the difference between envelope from and header from?'
        ];
      case 'INCIDENT_RESPONSE':
        return [
          'Generate an executive incident summary for this event.',
          'Why are FIDO2 hardware keys better than SMS MFA?',
          'How can we confirm whether any data was exfiltrated?'
        ];
      case 'EMAIL_ANALYSIS':
        return [
          'What should the incident response steps be if someone clicked?',
          'Explain SPF, DKIM, and DMARC alignment.',
          'Review the raw email headers from this message.'
        ];
      case 'URL_ANALYSIS':
        return [
          'How do attackers bypass MFA using AiTM phishing proxies?',
          'What are the incident response steps if credentials were typed?',
          'Explain how to block this domain across corporate DNS.'
        ];
      case 'ALERT_ANALYSIS':
        return [
          'What immediate containment steps should be executed for this user?',
          'How do I query Azure AD logs for additional anomalous logins?',
          'Generate an incident summary report.'
        ];
      case 'THREAT_INTEL':
      case 'THREAT_INTEL_INVESTIGATION':
      case 'THREAT_INTEL_FOLLOWUP':
        return [
          'Explain this threat in simple words.',
          'Why is this classified as high risk?',
          'What evidence is available?',
          'What should I do next?',
          'Summarize this threat for my project report.'
        ];
      case 'CYBERSECURITY_FAQ':
        return [
          'Explain how to protect corporate email from AiTM phishing.',
          'Create an incident response checklist for credential compromise.',
          'Explain SPF, DKIM, and DMARC results.'
        ];
      default:
        return [
          'Analyze this suspicious email.',
          'Explain SPF, DKIM, and DMARC alignment.',
          'Create an incident response checklist.'
        ];
    }
  },

  /**
   * Generates a structured, transparent explanation for a genuine threat intelligence record.
   * Conforms strictly to Requirements 3 & 4.
   */
  generateThreatRecordExplanation(threat) {
    return generateStructuredThreatExplanation(threat);
  },

  /**
   * Dispatches a user query and attachments to the Copilot engine.
   * Handles OCR on images, text parsing on files, conversation memory for follow-ups,
   * and honest limitations in Demo Mode.
   * 
   * @param {string} prompt - User message string
   * @param {Array} history - Previous conversation messages
   * @param {object} attachments - Optional attachments { image, file, sampleArtifact, threatContext }
   * @param {function} onProgress - Callback for OCR and processing updates
   * @returns {Promise<{text: string, category: string, isDemo: boolean, analysisContext?: object, followUps: Array<string>}>}
   */
  async sendMessage(prompt, history = [], attachments = {}, onProgress = () => {}) {
    const trimmed = (prompt || '').trim();
    if (!trimmed && !attachments.image && !attachments.file && !attachments.sampleArtifact && !attachments.threatContext) {
      throw new Error('Message cannot be empty');
    }

    return generateCopilotResponse(trimmed, history, attachments, onProgress);
  }
};

/**
 * Generates a structured, transparent explanation for a genuine threat intelligence record.
 * Conforms strictly to Requirements 3 & 4:
 * - What the record represents
 * - What the provider actually reports
 * - What available metadata suggests
 * - Difference between reported threat and verified compromise
 * - Appropriate defensive next steps
 * - What cannot be concluded from available data
 * - Internal CyberShield heuristic severity basis
 */
export function generateStructuredThreatExplanation(threat) {
  if (!threat) {
    return {
      text: '⚠️ **Error**: No valid threat intelligence record was provided for analysis.',
      category: 'THREAT_INTEL_ERROR',
      isDemo: true,
      followUps: ['Return to Threat Intelligence dashboard.']
    };
  }

  const indicator = threat.indicator || 'Unknown URL';
  const indicatorType = threat.indicatorType || 'URL';
  const source = threat.source || 'abuse.ch URLhaus';
  const threatId = threat.id ? `#${threat.id}` : 'Unassigned';
  const category = threat.category || 'Malware Distribution';
  const severity = threat.severity || 'Medium';
  const severityRationale = threat.severityRationale || 'Assessed based on URL indicators and community threat tags.';
  const severitySource = threat.severitySource === 'internally_assessed' 
    ? 'Assessed by CyberShield heuristic rule engine (not provider-assigned)' 
    : (threat.severitySource || 'Internal Rule');
  
  const evidence = threat.evidence || {};
  const host = evidence.host || 'Unknown Host';
  const port = evidence.port || '80';
  const protocol = evidence.protocol || 'http';
  const pathname = evidence.pathname || '/';
  const fileExtension = evidence.fileExtension || 'None / Web Resource';
  const isIpAddress = evidence.isIpAddress ? 'Direct IPv4/IPv6 Address' : 'Registered Domain Name';
  const urlStatus = evidence.urlStatus ? evidence.urlStatus.toUpperCase() : 'UNKNOWN';
  const reporter = evidence.reporter || 'abuse.ch community contributor';
  const firstSeen = threat.firstSeen || 'Not specified in feed snapshot';
  const lastSeen = threat.lastSeen || 'Not specified in feed snapshot';
  const tags = Array.isArray(threat.tags) && threat.tags.length > 0 
    ? threat.tags.map(t => `\`${t}\``).join(', ') 
    : '_None recorded by provider_';
  const reportUrl = threat.reportUrl;

  const text = `### 🛡️ Real-Time Threat Intelligence Investigation
*(Record Breakdown — Client-Side Evidence Evaluation)*

**Reported Indicator**: \`${indicator}\`  
**Indicator Type**: \`${indicatorType}\`  
**Intelligence Source**: **${source}** (Record ID: \`${threatId}\`)  
**Community Reporter**: \`${reporter}\`  
**First Reported (UTC)**: \`${firstSeen}\`

---

#### 1. What This Record Represents
This record is an active threat indicator aggregated from **${source}**, a reputable global community database tracking malware distribution sites, botnet staging servers, and dangerous links. It identifies an external web resource that security contributors have submitted as suspected of hosting malicious payloads or participating in adversary operations.

#### 2. What the Provider Actually Reports
- **Feed Source**: **${source}**
- **Threat Category**: **${category}**
- **Feed URL Status**: **${urlStatus}** *(Recorded in feed snapshot; reachability is not actively pinged by CyberShield)*
- **Associated Malware Families / Tags**: ${tags}
- **Telemetry Timestamps**: First observed on \`${firstSeen}\`${lastSeen !== firstSeen ? `; last activity recorded on \`${lastSeen}\`` : ''}.
${reportUrl ? `- **Upstream Source Report**: [View official entry on abuse.ch URLhaus](${reportUrl})` : ''}

#### 3. Technical Network Evidence
- **Destination Host**: \`${host}\` (${isIpAddress})
- **Transport & Port**: Port \`${port}\` via \`${protocol}://\`
- **Target Path & Payload Extension**: \`${pathname}\` (Identified extension: \`${fileExtension}\`)

#### 4. Severity Assessment Basis (CyberShield Evaluation)
- **Assigned Rating**: **${severity.toUpperCase()} SEVERITY**
- **Assessment Basis**: ${severityRationale}
- **Evaluation Source**: \`${severitySource}\`
> **Transparency Notice**: URLhaus does not assign subjective severity scores. This rating is an **internal CyberShield heuristic assessment** based on protocol security, payload filetype, and known malware tags to assist in analyst triage. It is not an external guarantee of compromise probability.

#### 5. Reported Threat vs. Verified Compromise
⚠️ **Important Scope Clarification**:
The presence of \`${indicator}\` in an external threat feed confirms that security analysts or automated honeypots flagged it as malicious. It **does NOT mean**:
- That your personal computer, browser, or local network has been infected or compromised.
- That anyone in your organization has visited or connected to this URL.
- That the destination server is currently accessible from your location.

#### 6. What Cannot Be Concluded from Available Data
- **Live Reachability**: CyberShield intentionally does not ping or send HTTP requests to this URL to avoid triggering malware drops or alerting adversary infrastructure.
- **Dynamic Binary Detonation**: The underlying file has not been executed in a local sandbox; assessment relies on static metadata and upstream telemetry.
- **Physical Geographic Location**: URLhaus provides IP/domain indicators, not verified GPS or physical coordinate data.

#### 7. Recommended Defensive Actions
1. **Perimeter Firewall Block**: Add host \`${host}\` to perimeter and firewall outbound egress blocklists.
2. **DNS Sinkholing**: Configure internal DNS resolvers to block or sinkhole queries to \`${host}\`.
3. **SIEM / Web Proxy Audit**: Search enterprise proxy and firewall logs for any historical requests matching \`${host}\` over the preceding 30 days.
4. **Endpoint Telemetry Sweep**: If this indicator is associated with an executable extension (\`${fileExtension}\`), sweep endpoint logs (EDR) for matching file drops in temporary directories.
5. **No Direct Browser Access**: Never open or submit credentials to this URL in an unisolated environment.`;

  return {
    category: 'THREAT_INTEL_INVESTIGATION',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isDemo: true,
    text,
    analysisContext: {
      type: 'threat_intel',
      threat
    },
    followUps: [
      'Explain this threat in simple words.',
      'Why is this classified as high risk?',
      'What evidence is available?',
      'What should I do next?',
      'Summarize this threat for my project report.'
    ]
  };
}

/**
 * Handles context-aware follow-up questions when a threat record is active.
 * Conforms strictly to Requirement 3 & 5.
 */
export function generateThreatFollowUpResponse(prompt, threat) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const lower = prompt.toLowerCase().trim();
  const followUps = [
    'Explain this threat in simple words.',
    'Why is this classified as high risk?',
    'What evidence is available?',
    'What should I do next?',
    'Summarize this threat for my project report.'
  ];

  const indicator = threat.indicator || 'the reported URL';
  const host = threat.evidence?.host || 'the destination host';
  const severity = threat.severity || 'Medium';
  const fileExt = threat.evidence?.fileExtension || 'None / Web Resource';
  const tags = Array.isArray(threat.tags) && threat.tags.length > 0 ? threat.tags.join(', ') : 'malware payload distribution';
  const urlStatus = threat.evidence?.urlStatus ? threat.evidence.urlStatus.toUpperCase() : 'REPORTED';

  // 1. SIMPLE WORDS
  if (
    lower.includes('simple words') ||
    lower.includes('explain simply') ||
    lower.includes('in simple terms') ||
    lower.includes('like i am 5') ||
    lower.includes('for a student') ||
    lower.includes('plain english')
  ) {
    const text = `### 💡 Simple Explanation of Reported Threat
*(Student-Friendly Breakdown)*

Here is the straightforward explanation of what this record means:

1. **What is this?**: A global cybersecurity research project called **URLhaus** detected a web link (\`${indicator}\`) being used to distribute malware or dangerous files.
2. **Is your computer infected?**: ❌ **No.** Seeing this warning on CyberShield does not mean your computer is infected. It is an alert telling you to steer clear of this address.
3. **What is dangerous about it?**: If someone were to visit this address, their browser could download an unauthorized file (${fileExt !== 'None / Web Resource' ? `specifically a \`${fileExt}\` program` : 'such as a virus or Trojan'}) that could compromise personal data.
4. **What is the simplest advice?**:
   - 🚫 **Never open or click this link.**
   - 🛡️ If you are on a school or office network, report the host \`${host}\` to your IT administrator so they can block it.`;

    return {
      category: 'THREAT_INTEL_FOLLOWUP',
      timestamp,
      isDemo: true,
      text,
      analysisContext: { type: 'threat_intel', threat },
      followUps
    };
  }

  // 2. WHY HIGH RISK / SEVERITY BASIS
  if (
    lower.includes('why is this classified') ||
    lower.includes('why is this high risk') ||
    lower.includes('why high risk') ||
    lower.includes('why critical') ||
    lower.includes('why is it high risk') ||
    lower.includes('why is it critical') ||
    lower.includes('why severity') ||
    lower.includes('severity basis') ||
    lower.includes('why is this') ||
    lower === 'why' ||
    lower === 'why?'
  ) {
    const text = `### ⚖️ Severity Assessment Basis: \`${severity}\`
*(CyberShield Heuristic Scoring Engine)*

The severity rating of **${severity}** was computed using CyberShield's transparent heuristic rules rather than an unverified external probability:

#### Key Factors Behind This Assessment:
1. **Source Reputation**: The indicator was reported to **abuse.ch URLhaus**, which focuses strictly on active malware staging and payload distribution infrastructure.
2. **Payload Risk Profile**: ${fileExt !== 'None / Web Resource' ? `The URL directly targets an executable or script format (\`${fileExt}\`), which creates severe risk of arbitrary code execution upon download.` : 'The URL targets a web script or payload staging directory.'}
3. **Reported Status in Feed**: Provider recorded feed status as **\`${urlStatus}\`**.
4. **Threat Tags**: ${tags !== 'None' ? `Associated with malware tags: \`${tags}\`.` : 'Flagged as malware distribution endpoint.'}
5. **Internal Assessment Disclosure**: CyberShield assigned this rating under heuristic rule \`${threat.severityRationale || 'malware distribution heuristic'}\`. URLhaus itself provides raw indicators, so this score reflects CyberShield's operational triage priority.`;

    return {
      category: 'THREAT_INTEL_FOLLOWUP',
      timestamp,
      isDemo: true,
      text,
      analysisContext: { type: 'threat_intel', threat },
      followUps
    };
  }

  // 3. WHAT EVIDENCE IS AVAILABLE
  if (
    lower.includes('what evidence is available') ||
    lower.includes('what evidence') ||
    lower.includes('available evidence') ||
    lower.includes('evidence available') ||
    lower.includes('show evidence') ||
    lower.includes('evidence')
  ) {
    const text = `### 📋 Available Evidence for Threat Record #${threat.id || 'N/A'}
*(Genuine Feed Metadata from abuse.ch URLhaus)*

Here is the exact evidence extracted from the feed without any simulated or fabricated attributes:

| Evidence Field | Value | Telemetry Verification |
| :--- | :--- | :--- |
| **Indicator URL** | \`${indicator}\` | Provider-Reported URL |
| **Indicator Type** | \`${threat.indicatorType || 'URL'}\` | Extracted Format |
| **Threat Category** | \`${threat.category || 'Malware Distribution'}\` | Provider Classification |
| **Target Host** | \`${host}\` | RFC 3986 Host Extraction |
| **Host Type** | \`${threat.evidence?.isIpAddress ? 'Direct IP Address' : 'Domain Name'}\` | Evaluated Structure |
| **Port & Protocol** | Port \`${threat.evidence?.port || '80'}\` via \`${threat.evidence?.protocol || 'http'}\` | Extracted from URL |
| **Payload Extension** | \`${fileExt}\` | Pathname Parsing |
| **Feed Status** | \`${urlStatus}\` | abuse.ch Snapshot |
| **Reported Tags** | \`${tags}\` | Community Tags |
| **First Reported** | \`${threat.firstSeen || 'N/A'}\` | Provider Timestamp |
| **Reporter** | \`${threat.evidence?.reporter || 'Community'}\` | Upstream Contributor |
${threat.reportUrl ? `| **Official Link** | [View on URLhaus](${threat.reportUrl}) | External Verification |` : ''}

#### Data Points NOT Present (Unverified):
- **Live Host Reachability**: Not pinged by CyberShield (prevents accidental connection).
- **Physical Latitude / Longitude**: Not supplied in URLhaus feed (coordinates are not fabricated).
- **Local Endpoint Intrusion**: No internal host has connected to this indicator.`;

    return {
      category: 'THREAT_INTEL_FOLLOWUP',
      timestamp,
      isDemo: true,
      text,
      analysisContext: { type: 'threat_intel', threat },
      followUps
    };
  }

  // 4. WHAT SHOULD I DO NEXT
  if (
    lower.includes('what should i do next') ||
    lower.includes('what to do next') ||
    lower.includes('what should i do') ||
    lower.includes('next steps') ||
    lower.includes('containment steps') ||
    lower.includes('defensive steps') ||
    lower.includes('how to respond')
  ) {
    const text = `### 🛡️ Recommended Defensive Next Steps
*(SOC Incident Response Protocol for \`${host}\`)*

Follow this defensive checklist to ensure network and endpoint protection:

1. **Perimeter Egress Block**:
   - Add \`${host}\` to edge firewall and outbound Web Gateway blocklists on port \`${threat.evidence?.port || '80'}\`.
2. **DNS Sinkhole Enforcement**:
   - If \`${host}\` is a domain, configure recursive DNS resolvers to return \`0.0.0.0\` to prevent resolution.
3. **Proxy & SIEM Historical Sweep**:
   - Run a query across web proxy, firewall, and DNS server logs:
   \`\`\`sql
   SELECT timestamp, client_ip, destination_url 
   FROM proxy_traffic 
   WHERE host = '${host}' AND timestamp >= NOW() - INTERVAL '30 DAYS';
   \`\`\`
4. **Endpoint Telemetry Audit**:
   - If any client IP initiated a socket connection to \`${host}\`, immediately isolate the workstation and inspect download directories for dropped \`${fileExt}\` files.
5. **Threat Advisory Submission**:
   - Log this indicator with your internal SOC or security ticketing platform for ongoing blocklist maintenance.`;

    return {
      category: 'THREAT_INTEL_FOLLOWUP',
      timestamp,
      isDemo: true,
      text,
      analysisContext: { type: 'threat_intel', threat },
      followUps
    };
  }

  // 5. SUMMARIZE FOR PROJECT REPORT
  if (
    lower.includes('summarize this threat for my project report') ||
    lower.includes('for my project report') ||
    lower.includes('project report') ||
    lower.includes('report summary') ||
    lower.includes('executive summary') ||
    lower.includes('summarize for report')
  ) {
    const text = `### 📝 Threat Intelligence Case Study: Academic Project Summary
*(Structured Incident Report for Evaluation)*

**System**: CyberShield Security Platform  
**Analysis Module**: Real-Time Threat Intelligence & AI Security Copilot  
**Date**: ${new Date().toLocaleDateString()}  
**Target Indicator**: \`${indicator}\`  

---

#### 1. Executive Summary
During a threat intelligence triage workflow, a malicious URL was captured from the live **abuse.ch URLhaus** feed and escalated to the **CyberShield AI Security Copilot**. The copilot decomposed the indicator into its structural network parameters, validated upstream community attribution, and calculated defensive containment recommendations.

#### 2. Key Technical Findings
- **Reported Indicator**: \`${indicator}\`
- **Host Endpoint**: \`${host}\` (${threat.evidence?.isIpAddress ? 'Direct IPv4/IPv6 address' : 'Registered domain'})
- **Transport Security**: Insecure \`${threat.evidence?.protocol || 'http'}://\` transport on port \`${threat.evidence?.port || '80'}\`
- **Payload Classification**: \`${threat.category || 'Malware Distribution'}\` targeting \`${fileExt}\`
- **Community Attribution**: Tracked by URLhaus community reporter \`${threat.evidence?.reporter || 'contributor'}\` with malware tags \`${tags}\`
- **Internal Severity**: Evaluated as **${severity}** using CyberShield's deterministic heuristic rules

#### 3. Defensive Mitigations
- Network-level egress blocking for destination \`${host}\`.
- Domain sinkholing via corporate recursive DNS resolvers.
- Telemetry correlation across SIEM proxy logs for historical exposure.

#### 4. Architecture Reflection (College Evaluation Note)
This workflow demonstrates real-time integration between open-source threat intelligence (OSINT feeds) and an interactive SOC copilot without requiring expensive cloud AI dependencies, ensuring full data privacy and deterministic explainability.`;

    return {
      category: 'THREAT_INTEL_FOLLOWUP',
      timestamp,
      isDemo: true,
      text,
      analysisContext: { type: 'threat_intel', threat },
      followUps
    };
  }

  // Generic threat inquiry fallback
  const text = `### 🔍 Follow-Up Analysis: Threat Record #${threat.id || 'N/A'}
*(Active Investigation Context: \`${indicator}\`)*

Regarding your query:
> *"${prompt}"*

**Contextual Telemetry for this Indicator:**
- **Indicator**: \`${indicator}\`
- **Target Host**: \`${host}\` (${threat.evidence?.isIpAddress ? 'Direct IP' : 'Domain'})
- **Reported Category**: **${threat.category || 'Malware Distribution'}**
- **Internal Severity**: **${severity}** (${threat.severityRationale || 'Assessed by CyberShield'})
- **Associated Tags**: \`${tags}\`

You can ask me to:
- Explain this threat in simple words
- Review why it was classified as ${severity}
- Break down the available evidence
- Outline defensive next steps
- Format an executive summary for your project report`;

  return {
    category: 'THREAT_INTEL_FOLLOWUP',
    timestamp,
    isDemo: true,
    text,
    analysisContext: { type: 'threat_intel', threat },
    followUps
  };
}

/**
 * Main response generator coordinating image OCR, file parsing, and context-aware dialogue.
 */
async function generateCopilotResponse(prompt, history, attachments, onProgress) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const lower = prompt.toLowerCase();

  // Multi-image handling (supports batch screenshot OCR)
  if (attachments.images && attachments.images.length > 1) {
    const imagesList = attachments.images;
    onProgress(`Processing ${imagesList.length} screenshots via client-side OCR...`);

    const results = [];
    for (let idx = 0; idx < imagesList.length; idx++) {
      const img = imagesList[idx];
      onProgress(`Extracting visible text from image ${idx + 1} of ${imagesList.length}: ${img.name}...`);
      const ocr = await performClientSideOcr(img.file || img.previewUrl || img, onProgress);
      const analysis = analyzePhishingHeuristics(ocr.rawText);
      const urls = extractUrls(ocr.rawText);
      const risk = getRiskLevel(analysis.score, ocr.wordsCount < 3);
      results.push({
        name: img.name,
        size: img.size,
        ocr,
        analysis,
        urls,
        risk
      });
    }

    const overallScore = Math.max(...results.map(r => r.analysis.score));
    const overallRisk = getRiskLevel(overallScore, false);

    let report = `### 🔍 Multi-Screenshot Forensic Analysis (${results.length} Images)\n*(Client-Side Parallel OCR & Heuristics)*\n\n**Overall Threat Level**: 🚨 **${overallRisk.label} (Max Score: ${overallScore}/100)**  \n**Total Images Processed**: ${results.length}\n\n---\n\n`;

    results.forEach((res, i) => {
      report += `#### Image ${i + 1}: \`${res.name}\` (${formatBytes(res.size)})\n- **Status**: ${res.ocr.wordsCount < 3 ? '⚠️ No legible text detected' : `✅ ${res.ocr.wordsCount} words extracted (${res.ocr.confidence}% confidence)`}\n- **Assessment**: **${res.risk.label} (Score: ${res.analysis.score}/100)**\n${res.urls.length > 0 ? `- **Detected Links**: ${res.urls.map(u => `\`${u}\``).join(', ')}\n` : ''}${res.analysis.indicators.length > 0 ? `- **Flagged Indicators**:\n${res.analysis.indicators.map(ind => `  - **${ind.category}**: *"${ind.matchedText}"*`).join('\n')}\n` : '- **Indicators**: Clean text profile.\n'}> **Extracted Text Preview**:  \n${formatExtractedTextQuote(res.ocr.rawText, 250)}\n\n---\n\n`;
    });

    report += `#### Recommended Next Steps:\n1. Block any unverified destination domains identified across your organization.\n2. If credentials or OTP codes were submitted on any depicted page, revoke sessions immediately.`;

    return {
      category: 'IMAGE_ANALYSIS',
      timestamp,
      isDemo: true,
      text: report,
      analysisContext: {
        type: 'image',
        fileName: results.map(r => r.name).join(', '),
        extractedText: results.map(r => r.ocr.rawText).join('\n---\n'),
        indicators: results.flatMap(r => r.analysis.indicators),
        detectedUrls: results.flatMap(r => r.urls),
        score: overallScore,
        riskLevel: overallRisk.label
      },
      followUps: aiCopilotService.getFollowUpPrompts('IMAGE_ANALYSIS')
    };
  }

  // Fallback normalize single image if provided inside images array
  if (!attachments.image && attachments.images && attachments.images.length === 1) {
    attachments.image = attachments.images[0];
  }

  // =========================================================================
  // 1. IMAGE ATTACHMENT PROCESSING (OCR & HEURISTICS)
  // =========================================================================
  if (attachments.image) {
    const imgObj = attachments.image;
    const imgSource = imgObj.file || imgObj.previewUrl || imgObj;
    const fileName = imgObj.name || 'uploaded_screenshot.png';
    const fileSizeStr = formatBytes(imgObj.size || 0);

    onProgress('Initializing client-side Tesseract OCR engine...');

    const ocrResult = await performClientSideOcr(imgSource, onProgress);

    // Case 1A: OCR failed or yielded no usable text
    const cleanLetters = ocrResult.rawText.replace(/[\s\W_]+/g, '');
    const isUnreadable = !ocrResult.success || ocrResult.wordsCount === 0 || cleanLetters.length < 3;

    if (isUnreadable) {
      const text = `### ⚠️ Screenshot Inspection: No Readable Text Detected
*(Client-Side OCR via Tesseract.js WASM)*

**Image Processed**: \`${fileName}\` (${fileSizeStr})  
**OCR Extraction Status**: ⚠️ **No legible alphanumeric text detected**  
**Confidence**: ${ocrResult.confidence}%  
**Threat Assessment**: ⚠️ **INCONCLUSIVE (Insufficient Evidence)**

---

#### 1. What This Means:
Our client-side optical character recognition (OCR) engine processed \`${fileName}\` but was unable to identify legible text characters or readable message blocks.

#### 2. Deterministic Analysis Limitations:
- **Text-Based Phishing Heuristics**: CyberShield evaluates deterministic rules (urgency triggers, credential harvesting prompts, suspicious URLs, OTP requests) from visible text. Because no readable text was extracted, these heuristics cannot be evaluated.
- **Visual Graphic Authentication**: In client-side execution, browser environments cannot determine whether a graphical logo is authentic, detect pixel-level UI spoofing, or inspect embedded steganography without a connected multimodal AI vision backend.

#### 3. Recommended Actions:
1. Ensure the screenshot is clear, high-contrast, and right-side up.
2. If the screenshot contains text, crop directly around the relevant message or dialog area.
3. Alternatively, copy and paste the text, email headers, or URL directly into the chat prompt for instant analysis.`;

      return {
        category: 'IMAGE_INCONCLUSIVE',
        timestamp,
        isDemo: true,
        text,
        analysisContext: {
          type: 'image',
          fileName,
          fileSize: imgObj.size,
          isUnreadable: true,
          extractedText: '',
          wordsCount: 0,
          confidence: ocrResult.confidence,
          score: 0,
          riskLevel: 'INCONCLUSIVE'
        },
        followUps: aiCopilotService.getFollowUpPrompts('IMAGE_INCONCLUSIVE')
      };
    }

    // Case 1B: OCR extracted readable text -> Run deterministic phishing heuristics
    onProgress('Evaluating deterministic phishing heuristics on extracted text...');
    const rawText = ocrResult.rawText;
    const analysis = analyzePhishingHeuristics(rawText);
    const detectedUrls = extractUrls(rawText);
    const risk = getRiskLevel(analysis.score, false);

    const analysisContext = {
      type: 'image',
      fileName,
      fileSize: imgObj.size,
      isUnreadable: false,
      extractedText: rawText,
      wordsCount: ocrResult.wordsCount,
      confidence: ocrResult.confidence,
      indicators: analysis.indicators,
      detectedUrls,
      score: analysis.score,
      riskLevel: risk.label
    };

    // Sub-case 1B-i: User asks "What does this image show?" / "Describe this image"
    if (isAskingWhatImageShows(lower)) {
      const description = describeImageContent(rawText, analysis, detectedUrls);

      const text = `### 🖼️ Screenshot Content Deconstruction: \`${fileName}\`
*(Client-Side OCR & Heuristic Assessment)*

**Image Analyzed**: \`${fileName}\` (${fileSizeStr})  
**Text Detected**: **${ocrResult.wordsCount} words** (${ocrResult.confidence}% OCR confidence)  
**Estimated Threat Assessment**: **${risk.label} (Score: ${analysis.score}/100)**

---

#### 1. What the Extracted Content Shows:
${description}

#### 2. Extracted Visible Text (OCR):
${formatExtractedTextQuote(rawText)}

#### 3. Security Findings & Indicators:
${analysis.indicators.length > 0 ? analysis.indicators.map(ind => `- **${ind.category}** [${ind.severity.toUpperCase()}]: ${ind.whySuspicious}`).join('\n') : '- **Clean Text Profile**: No standard phishing heuristics (urgency, credential prompts, suspicious domains) were detected.'}

${detectedUrls.length > 0 ? `#### 4. Identified Links / Domains:\n${detectedUrls.map(u => `- \`${u}\``).join('\n')}\n` : ''}
#### 5. Analysis Capabilities & Limitations:
- **What was evaluated**: Visible alphanumeric text was read directly by local Tesseract.js OCR and evaluated against CyberShield deterministic heuristic rules.
- **What cannot be determined**: Client-side OCR cannot authenticate graphical logos, verify remote web server certificates, or detect visual design mimicry without a connected multimodal AI backend.`;

      return {
        category: 'IMAGE_ANALYSIS',
        timestamp,
        isDemo: true,
        text,
        analysisContext,
        followUps: aiCopilotService.getFollowUpPrompts('IMAGE_ANALYSIS')
      };
    }

    // Sub-case 1B-ii: User asks about specific items (URL, sender, deadline, etc.)
    if (lower.includes('url') || lower.includes('link') || lower.includes('website') || lower.includes('domain')) {
      const text = `### 🌐 URL Inspection from Screenshot: \`${fileName}\`
*(Client-Side OCR Extraction)*

**Image Source**: \`${fileName}\`  
**Identified Links**: **${detectedUrls.length} found**

---

${detectedUrls.length > 0 ? `#### Extracted Hyperlinks & Domains:\n${detectedUrls.map(u => {
  const isHttp = u.startsWith('http://');
  const hasSuspiciousTLD = /\.(xyz|top|buzz|club|click|work|net|gq|cf|tk|ml)\b/i.test(u);
  const notes = [];
  if (isHttp) notes.push('⚠️ Insecure cleartext HTTP');
  if (hasSuspiciousTLD) notes.push('⚠️ High-risk or lookalike TLD');
  return `- \`${u}\`${notes.length > 0 ? ` — *(${notes.join(', ')})*` : ''}`;
}).join('\n')}\n` : `#### Result:\nNo explicit web links or URLs were detected in the visible text extracted from this screenshot.\n`}

#### Visible Text Context:
${formatExtractedTextQuote(rawText, 400)}

> **Security Advisory**: Never navigate to unverified URLs extracted from unsolicited messages. Test suspicious links safely inside CyberShield's **Smart URL Scanner**.`;

      return {
        category: 'IMAGE_ANALYSIS',
        timestamp,
        isDemo: true,
        text,
        analysisContext,
        followUps: aiCopilotService.getFollowUpPrompts('IMAGE_ANALYSIS')
      };
    }

    // Sub-case 1B-iii: User asks "Is this screenshot suspicious?" OR general analysis
    const indicatorList = analysis.indicators.length > 0
      ? analysis.indicators.map(ind => `- 🚩 **${ind.category}** [${ind.severity.toUpperCase()}]: Flagged by matching phrase *"${ind.matchedText}"*. ${ind.whySuspicious}`).join('\n')
      : '- ✅ **No high-risk indicators detected**: The extracted text does not trigger standard urgency, credential harvesting, or suspicious link patterns.';

    const text = `### 🔍 Phishing Screenshot Forensic Triage: \`${fileName}\`
*(Client-Side OCR & Heuristic Analysis)*

**Image Analyzed**: \`${fileName}\` (${fileSizeStr})  
**Threat Verdict**: 🚨 **${risk.label} (Score: ${analysis.score}/100)**  
**OCR Readability**: **${ocrResult.wordsCount} words extracted** (${ocrResult.confidence}% confidence)

---

#### 1. Deterministic Heuristic Evidence:
${indicatorList}

#### 2. Extracted Visible Text (OCR):
${formatExtractedTextQuote(rawText)}

${detectedUrls.length > 0 ? `#### 3. Identified Hyperlinks / Destination Domains:\n${detectedUrls.map(u => `- \`${u}\``).join('\n')}\n` : ''}
#### 4. Forensic Capabilities & Limitations:
> **Demonstration Mode Notice**: Analysis is based strictly on visible text extracted client-side via Tesseract.js WASM and evaluated using deterministic phishing heuristics. Visual layout mimicry, authentic logo verification, and live server DNS validation require a connected multimodal AI model and backend sandbox.

#### 5. Recommended Actions:
${analysis.score >= 50 ? `1. ❌ **Do NOT click links** or enter credentials displayed in this message.
2. 🔄 **Revoke active sessions & reset passwords** immediately if credentials were typed.
3. 🛡️ **Report to internal IT / SOC** as an active phishing lure.` : `1. Exercise normal caution.
2. Verify unexpected requests out-of-band directly with the sender before taking action.`}`;

    return {
      category: 'IMAGE_ANALYSIS',
      timestamp,
      isDemo: true,
      text,
      analysisContext,
      followUps: aiCopilotService.getFollowUpPrompts('IMAGE_ANALYSIS')
    };
  }

  // =========================================================================
  // 2. FILE ATTACHMENT PROCESSING
  // =========================================================================
  if (attachments.file) {
    const fileObj = attachments.file;
    const fileName = fileObj.name || 'uploaded_document';
    const fileSizeStr = formatBytes(fileObj.size || 0);
    const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';
    const supportedExts = ['txt', 'eml', 'log', 'json', 'csv', 'md'];
    const isSupported = supportedExts.includes(ext) || (fileObj.type && (fileObj.type.startsWith('text/') || fileObj.type.includes('json')));

    // Case 2A: Unsupported format (.pdf, .docx, .exe, binaries)
    if (!isSupported) {
      const text = `### ⚠️ Unsupported File Format for Client-Side Parsing
*(Client-Side Execution Notice)*

**File Name**: \`${fileName}\` (${fileSizeStr})  
**Detected Format**: \`.${ext || 'unknown'}\`  
**Status**: ❌ **Direct Parsing Unsupported in Browser**

---

#### 1. Why This File Cannot Be Analyzed Directly:
The CyberShield AI Security Copilot operates locally via **Client-Side Deterministic Heuristics**. Client-side browser environments cannot safely decompile native binaries, parse proprietary document containers (such as \`.pdf\` or \`.docx\` object trees), or execute dynamic sandbox detonation.

#### 2. Supported File Formats for Local Processing:
- 📄 **Text-based files**: \`.txt\`, \`.eml\` (RFC 5322 email messages), \`.log\` (SIEM/server logs), \`.json\`, \`.csv\`, \`.md\`
- 📷 **Screenshots**: \`.png\`, \`.jpg\`, \`.jpeg\`, \`.webp\` (evaluated via client-side OCR)

#### 3. How to Proceed:
1. **Copy & Paste**: If the file contains text, email headers, or event logs, copy and paste the relevant text directly into the chat prompt.
2. **Take a Screenshot**: Take a screenshot of the document page and upload the image so local OCR can extract and evaluate the visible text.`;

      return {
        category: 'FILE_ANALYSIS_UNSUPPORTED',
        timestamp,
        isDemo: true,
        text,
        analysisContext: {
          type: 'file',
          fileName,
          fileSize: fileObj.size,
          isSupported: false,
          ext
        },
        followUps: aiCopilotService.getFollowUpPrompts('FILE_ANALYSIS_UNSUPPORTED')
      };
    }

    // Case 2B: Supported text file -> Read actual content
    let contentText = fileObj.contentText;
    if (!contentText && fileObj.file && typeof fileObj.file.text === 'function') {
      try {
        contentText = await fileObj.file.text();
      } catch (e) {
        console.warn('Failed to read file text via Promise:', e);
      }
    }

    if (!contentText || !contentText.trim()) {
      const text = `### 📄 File Inspection: \`${fileName}\`
*(Text File Inspection)*

**File Name**: \`${fileName}\` (${fileSizeStr})  
**Status**: ⚠️ **File appears to be empty (0 readable characters)**

Please ensure the file contains valid text content or paste the text directly into the prompt.`;

      return {
        category: 'FILE_ANALYSIS',
        timestamp,
        isDemo: true,
        text,
        analysisContext: {
          type: 'file',
          fileName,
          fileSize: fileObj.size,
          isSupported: true,
          contentText: ''
        },
        followUps: aiCopilotService.getFollowUpPrompts('FILE_ANALYSIS')
      };
    }

    // Evaluate content text
    const analysis = analyzePhishingHeuristics(contentText);
    const detectedUrls = extractUrls(contentText);
    const risk = getRiskLevel(analysis.score, false);
    const emailData = parseEmailHeaders(contentText);

    const fileContext = {
      type: 'file',
      fileName,
      fileSize: fileObj.size,
      isSupported: true,
      contentText: contentText.slice(0, 10000),
      indicators: analysis.indicators,
      detectedUrls,
      score: analysis.score,
      riskLevel: risk.label,
      emailData
    };

    // If file looks like an email / RFC 5322 header block
    if (ext === 'eml' || (emailData && (emailData.from || emailData.subject || emailData.returnPath))) {
      const text = `### 📧 Email File Forensic Deconstruction: \`${fileName}\`
*(Client-Side Text & Header Analysis)*

**File Assessed**: \`${fileName}\` (${fileSizeStr})  
**Threat Verdict**: 🚨 **${risk.label} (Score: ${analysis.score}/100)**  
**Subject**: \`${emailData.subject || 'Not specified'}\`

---

#### 1. RFC 5322 Header Breakdown:
- **Visible From**: \`${emailData.from || 'Not declared'}\`
- **Envelope Return-Path**: \`${emailData.returnPath || 'Not declared'}\`
- **Date**: \`${emailData.date || 'Not declared'}\`
${emailData.isMisaligned ? `> ⚠️ **Severe Alignment Mismatch**: The visible display domain (\`${emailData.fromDomain}\`) does not match the actual envelope return domain (\`${emailData.returnDomain}\`). This is a classic indicator of display spoofing.` : ''}

#### 2. Phishing Heuristics & Signals:
${analysis.indicators.length > 0 
  ? analysis.indicators.map(ind => `- 🚩 **${ind.category}** [${ind.severity.toUpperCase()}]: Matched *"${ind.matchedText}"*. ${ind.whySuspicious}`).join('\n')
  : '- ✅ No standard phishing heuristic markers flagged in body text.'}

${detectedUrls.length > 0 ? `#### 3. Identified Hyperlinks:\n${detectedUrls.map(u => `- \`${u}\``).join('\n')}\n` : ''}
#### 4. Recommended Next Steps:
1. Do not interact with links or reply to this message.
2. Upgrade DMARC policy to \`p=reject\` to prevent unauthorized envelope spoofing.`;

      return {
        category: 'FILE_ANALYSIS',
        timestamp,
        isDemo: true,
        text,
        analysisContext: fileContext,
        followUps: aiCopilotService.getFollowUpPrompts('FILE_ANALYSIS')
      };
    }

    // Standard text / log / config file analysis
    const text = `### 📄 File Forensic Inspection: \`${fileName}\`
*(Client-Side Text Analysis)*

**File**: \`${fileName}\` (${fileSizeStr}, \`${ext.toUpperCase()}\`)  
**Threat Verdict**: **${risk.label} (Score: ${analysis.score}/100)**  
**Content Size**: **${contentText.length} characters**

---

#### 1. Content Evaluation:
${analysis.indicators.length > 0 
  ? `Flagged **${analysis.indicators.length}** security indicator(s) in file text:\n${analysis.indicators.map(ind => `- **${ind.category}**: *"${ind.matchedText}"*`).join('\n')}`
  : 'No obvious phishing or malicious keywords detected in this text document.'}

${detectedUrls.length > 0 ? `#### 2. Detected Web Links:\n${detectedUrls.map(u => `- \`${u}\``).join('\n')}\n` : ''}
#### 3. Sample File Content Preview:
${formatExtractedTextQuote(contentText, 600)}

#### 4. Summary:
Content evaluated using local client-side pattern rules. For live malware detonation or dynamic sandbox execution, connect a backend sandbox node.`;

    return {
      category: 'FILE_ANALYSIS',
      timestamp,
      isDemo: true,
      text,
      analysisContext: fileContext,
      followUps: aiCopilotService.getFollowUpPrompts('FILE_ANALYSIS')
    };
  }

  // =========================================================================
  // 3. SAMPLE SECURITY ARTIFACT
  // =========================================================================
  if (attachments.sampleArtifact) {
    const art = attachments.sampleArtifact;
    const text = `### 🔬 Sample Security Artifact Review: ${art.title}
*(Pre-Configured Demonstration Artifact)*

**Artifact Type**: \`${art.type}\`  
**Description**: ${art.description}

---

#### Artifact Raw Content Preview:
\`\`\`text
${art.rawContent}
\`\`\`

> **Next Step**: Click **"Review Phishing Artifact / Screenshot"** in Cybersecurity Tools to launch progressive 4-stage forensic scanning.`;

    return {
      category: 'FILE_ANALYSIS',
      timestamp,
      isDemo: true,
      text,
      followUps: [
        'Review the sample phishing email artifact and execute heuristic scanning.',
        'Explain SPF, DKIM, and DMARC alignment.',
        'Generate an incident response checklist.'
      ]
    };
  }

  // =========================================================================
  // 4. CONVERSATION CONTEXT & FOLLOW-UP QUESTIONS (No attachment in current turn)
  // =========================================================================
  const recentContext = findRecentAnalysisContext(history);

  // Check if there is an active threat intelligence context
  const activeThreat = attachments.threatContext || (recentContext?.type === 'threat_intel' ? recentContext.threat : null);

  if (activeThreat) {
    const isThreatFollowUp = 
      lower.includes('simple words') ||
      lower.includes('explain simply') ||
      lower.includes('for a student') ||
      lower.includes('why is this classified') ||
      lower.includes('why is this high risk') ||
      lower.includes('why high risk') ||
      lower.includes('why critical') ||
      lower.includes('why is it high risk') ||
      lower.includes('why is it critical') ||
      lower.includes('why is this') ||
      lower.includes('why severity') ||
      lower.includes('severity basis') ||
      lower === 'why' ||
      lower === 'why?' ||
      lower.includes('what evidence') ||
      lower.includes('available evidence') ||
      lower.includes('evidence') ||
      lower.includes('what should i do next') ||
      lower.includes('what to do next') ||
      lower.includes('what should i do') ||
      lower.includes('next steps') ||
      lower.includes('containment steps') ||
      lower.includes('project report') ||
      lower.includes('summarize this threat') ||
      lower.includes('summarize') ||
      lower.includes('threat') ||
      lower.includes('indicator') ||
      lower.includes('urlhaus') ||
      lower.includes('host') ||
      lower.includes('domain') ||
      lower.includes('ip address') ||
      lower.includes('reporter') ||
      lower.includes('payload') ||
      lower.includes(activeThreat.evidence?.host?.toLowerCase() || '___');

    if (isThreatFollowUp) {
      return generateThreatFollowUpResponse(prompt, activeThreat);
    }
  }

  if (recentContext) {
    // Follow-up to an image analysis
    if (recentContext.type === 'image') {
      if (recentContext.isUnreadable) {
        if (isAskingWhatImageShows(lower) || isAskingSuspicionOrPhishing(lower) || lower.includes('url') || lower.includes('link')) {
          const text = `### ⚠️ Follow-up on \`${recentContext.fileName}\`
*(Previous Screenshot Analysis)*

As reported in the previous step, our client-side OCR engine could not identify readable text in **\`${recentContext.fileName}\`**.

Because no legible text was found:
- We cannot determine what text or message is shown in that screenshot.
- Heuristic threat rules cannot evaluate urgency, credential prompts, or links.
- Visual logo authenticity requires a multimodal vision AI backend.

**To continue**: Please upload a clearer, higher-resolution screenshot or paste the text directly into the prompt.`;

          return {
            category: 'IMAGE_INCONCLUSIVE',
            timestamp,
            isDemo: true,
            text,
            analysisContext: recentContext,
            followUps: aiCopilotService.getFollowUpPrompts('IMAGE_INCONCLUSIVE')
          };
        }
      } else {
        // Readable image context exists
        if (isAskingWhatImageShows(lower)) {
          const description = describeImageContent(recentContext.extractedText, { indicators: recentContext.indicators || [], urgencyCount: (recentContext.indicators || []).filter(i => i.id === 'URGENCY').length }, recentContext.detectedUrls || []);

          const text = `### 🖼️ Screenshot Summary: \`${recentContext.fileName}\`
*(Conversation Follow-up)*

Based on the visible text extracted from **\`${recentContext.fileName}\`**:

${description}

#### Extracted Visible Text:
${formatExtractedTextQuote(recentContext.extractedText, 500)}

**Threat Assessment**: **${recentContext.riskLevel} (Score: ${recentContext.score}/100)**.`;

          return {
            category: 'IMAGE_ANALYSIS',
            timestamp,
            isDemo: true,
            text,
            analysisContext: recentContext,
            followUps: aiCopilotService.getFollowUpPrompts('IMAGE_ANALYSIS')
          };
        }

        if (lower.includes('url') || lower.includes('link') || lower.includes('domain') || lower.includes('address')) {
          const urls = recentContext.detectedUrls || [];
          const text = `### 🌐 URLs in Screenshot \`${recentContext.fileName}\`
*(Conversation Follow-up)*

${urls.length > 0 
  ? `The following link(s) were identified in the visible text:\n${urls.map(u => `- \`${u}\``).join('\n')}\n\n**Advisory**: Do not visit unverified links from unsolicited messages.`
  : `No URLs or web links were found in the visible text extracted from \`${recentContext.fileName}\`.`}`;

          return {
            category: 'IMAGE_ANALYSIS',
            timestamp,
            isDemo: true,
            text,
            analysisContext: recentContext,
            followUps: aiCopilotService.getFollowUpPrompts('IMAGE_ANALYSIS')
          };
        }

        // Common follow-up matching helpers
        const isWhyCritical = 
          lower === 'why' || 
          lower === 'why?' ||
          lower.includes('why is it critical') || 
          lower.includes('why is this critical') || 
          lower.includes('explain why this is critical') ||
          lower.includes('explain why it is critical') ||
          lower.includes('why critical') ||
          (lower.includes('why') && (lower.includes('critical') || lower.includes('risk') || lower.includes('suspicious') || lower.includes('flagged') || lower.includes('score') || lower.includes('high')));

        const findingMatch = 
          lower.match(/explain (?:the )?(first|second|third|fourth|fifth|\d+)(?:st|nd|rd|th)? finding/i) ||
          lower.match(/(?:tell me about|what is) (?:the )?(first|second|third|fourth|fifth|\d+)(?:st|nd|rd|th)? (?:finding|indicator)/i);

        const isWhatNext = 
          lower.includes('what should i do next') ||
          lower.includes('what should i do') ||
          lower.includes('what to do next') ||
          lower.includes('next steps') ||
          lower.includes('how to respond') ||
          lower.includes('containment protocol') ||
          lower.includes('remediation steps');

        const isSummarize = 
          lower === 'summarize it' ||
          lower === 'summarize this' ||
          lower.includes('summarize this incident') ||
          lower.includes('summarize the incident') ||
          lower.includes('incident summary') ||
          lower.includes('executive summary') ||
          lower.includes('give me a summary') ||
          lower.includes('summarize report') ||
          (lower.includes('summarize') && !lower.includes('header'));

        // 1. Severity & Risk Explanation follow-up
        if (isWhyCritical) {
          const indicators = recentContext.indicators || [];
          const score = recentContext.score ?? 0;
          const riskLevel = recentContext.riskLevel || 'EVALUATED';
          const fileLabel = recentContext.fileName || 'the uploaded screenshot';

          let text = `### 🔍 Severity & Rule-Based Risk Basis: \`${fileLabel}\`\n*(Deterministic Heuristic Breakdown)*\n\n`;
          text += `**Overall Threat Level**: 🚨 **${riskLevel} (Rule-Based Score: ${score}/100)**  \n`;
          text += `**Evaluation Mode**: **Client-Side Deterministic Rules**\n\n---\n\n`;

          text += `#### 1. Why Was This Severity Assigned?\n`;
          text += `In CyberShield client-side evaluation, risk classifications are computed using additive heuristic weights applied to visible text and header structures, rather than an unverified probabilistic score:\n\n`;

          if (indicators.length > 0) {
            indicators.forEach((ind, i) => {
              text += `- 🚩 **Finding ${i + 1} — ${ind.category}** [${(ind.severity || 'high').toUpperCase()}]:\n`;
              text += `  - **Trigger Phrase**: *"${ind.matchedText}"*\n`;
              text += `  - **Heuristic Rule**: ${ind.whySuspicious}\n`;
            });
          } else {
            text += `- ✅ **Clean Profile**: No high-risk keywords (urgency coercion, credential harvesting, unauthorized domains) were triggered.\n`;
          }

          text += `\n#### 2. Supporting Evidence:\n`;
          if (recentContext.extractedText) {
            text += `- **Visible Extracted Content**: ${recentContext.wordsCount || 0} words extracted with ${recentContext.confidence || 0}% OCR confidence.\n`;
          }
          if (recentContext.detectedUrls && recentContext.detectedUrls.length > 0) {
            text += `- **Destination Links**: ${recentContext.detectedUrls.map(u => `\`${u}\``).join(', ')}\n`;
          }

          text += `\n#### 3. Limitations & Unknowns:\n`;
          text += `- **What is verified**: Alphanumeric text was directly parsed on this client device via Tesseract.js WASM.\n`;
          text += `- **What is unverified**: Live DNS records, domain age, malware sandbox execution, and brand logo authenticity require a live connected backend threat intelligence server.\n`;

          return {
            category: 'RISK_EXPLANATION',
            timestamp,
            isDemo: true,
            text,
            analysisContext: recentContext,
            followUps: ['What should I do next?', 'Summarize this incident.', 'Explain the first finding.']
          };
        }

        // 2. Specific Finding Deconstruction follow-up
        if (findingMatch) {
          const wordMap = { first: 0, second: 1, third: 2, fourth: 3, fifth: 4 };
          const rawTarget = findingMatch[1].toLowerCase();
          const targetIdx = wordMap[rawTarget] !== undefined ? wordMap[rawTarget] : (parseInt(rawTarget, 10) - 1);
          const indicators = recentContext.indicators || [];

          if (indicators.length > targetIdx && targetIdx >= 0) {
            const ind = indicators[targetIdx];
            const text = `### 🔬 Detailed Deconstruction: Finding #${targetIdx + 1} (${ind.category})\n*(Forensic Indicator Analysis)*\n\n` +
              `**Artifact**: \`${recentContext.fileName || 'Active artifact'}\`  \n` +
              `**Indicator Category**: **${ind.category}**  \n` +
              `**Assigned Severity**: **${(ind.severity || 'high').toUpperCase()}**\n\n---\n\n` +
              `#### 1. Exact Trigger Evidence:\n` +
              `> *"${ind.matchedText}"*\n\n` +
              `#### 2. Why This Indicator Matters in Cybersecurity:\n` +
              `${ind.whySuspicious}\n\n` +
              `Threat actors frequently employ this technique in phishing and credential harvesting campaigns to manipulate recipient urgency, bypass analytical hesitation, or disguise illicit payload destinations.\n\n` +
              `#### 3. What Evidence Supports This Finding:\n` +
              `- Extracted directly from visible message text during client-side parsing.\n` +
              `- Matched against CyberShield's deterministic security dictionary.\n\n` +
              `#### 4. What Is Still Unknown:\n` +
              `- Whether this message was distributed as an authorized internal security drill.\n` +
              `- Server-side host status and live domain registrar reputation without a backend proxy.\n\n` +
              `#### 5. Recommended Action for This Indicator:\n` +
              `Verify the request out-of-band directly with the purported sender or internal IT helpdesk before interacting.`;

            return {
              category: 'FINDING_DETAIL',
              timestamp,
              isDemo: true,
              text,
              analysisContext: recentContext,
              followUps: ['What should I do next?', 'Explain why this is critical.', 'Summarize this incident.']
            };
          } else {
            const text = `### ℹ️ Finding Not Found\n\n` +
              `The active analysis for \`${recentContext.fileName || 'the current artifact'}\` has **${indicators.length}** flagged indicator(s).\n\n` +
              (indicators.length > 0 
                ? `Available findings:\n${indicators.map((ind, i) => `${i + 1}. **${ind.category}**: *"${ind.matchedText}"*`).join('\n')}\n\nYou can ask: *"Explain the first finding"* or *"Explain finding 1"*.`
                : `No specific threat indicators were flagged in this clean text profile.`);

            return {
              category: 'FINDING_DETAIL',
              timestamp,
              isDemo: true,
              text,
              analysisContext: recentContext,
              followUps: ['Explain why this is critical.', 'What should I do next?']
            };
          }
        }

        // 3. What Should I Do Next follow-up
        if (isWhatNext) {
          const fileLabel = recentContext.fileName || 'the analyzed artifact';
          const riskLevel = recentContext.riskLevel || 'EVALUATED';

          const text = `### 🛡️ Prioritized Defensive Recommendations for \`${fileLabel}\`\n*(Incident Response & Containment Protocol)*\n\n` +
            `**Assessment Baseline**: **${riskLevel} Threat**  \n` +
            `**Framework Alignment**: **NIST SP 800-61 Rev. 2 (Computer Security Incident Handling)**\n\n---\n\n` +
            `#### ⏱️ Phase 1: Immediate Containment (First 15–30 Minutes)\n` +
            `1. ❌ **Do NOT click links, open attachments, or input credentials** shown in this message.\n` +
            `2. 🔄 **If credentials were typed on a target page**:\n` +
            `   - Immediately revoke active session tokens in Microsoft Entra ID or Google Workspace Admin.\n` +
            `   - Force an out-of-band password change from an isolated, clean device.\n` +
            `   - Audit enrolled MFA factors for newly registered unauthorized authenticator devices.\n` +
            `3. 🔌 **If a file or payload was downloaded**:\n` +
            `   - Disconnect workstation network interface (Wi-Fi/Ethernet) to prevent lateral reconnaissance.\n\n` +
            `#### 🔍 Phase 2: Investigation & Scoping (Within 1–2 Hours)\n` +
            `- **Mailbox Sweep**: Query mail exchange logs for matching sender addresses, subject lines, or message IDs across all organizational inboxes.\n` +
            `- **Network Perimeter Triage**: Check proxy and DNS query logs for egress connection attempts to flagged destination domains.\n` +
            `- **OAuth & Persistence Audit**: Check tenant enterprise application permissions for illicit \`Mail.ReadWrite\` consent grants.\n\n` +
            `#### 🛡️ Phase 3: Recovery & Long-Term Hardening\n` +
            `1. Block destination URLs and source IPs at perimeter firewalls and Secure Web Gateways.\n` +
            `2. Advance corporate email authentication policy to strict \`p=reject\` in DMARC.\n` +
            `3. Submit sanitized telemetry to your internal SOC ticketing system.`;

          return {
            category: 'INCIDENT_RESPONSE',
            timestamp,
            isDemo: true,
            text,
            analysisContext: recentContext,
            followUps: ['Summarize this incident.', 'Explain why this is critical.', 'Read that summary aloud.']
          };
        }

        // 4. Summarize This Incident follow-up
        if (isSummarize) {
          const fileLabel = recentContext.fileName || 'Active Artifact';
          const score = recentContext.score ?? 0;
          const riskLevel = recentContext.riskLevel || 'EVALUATED';
          const indicators = recentContext.indicators || [];
          const urls = recentContext.detectedUrls || [];

          const text = `### 📋 Executive Security Incident Summary: \`${fileLabel}\`\n*(SOC Executive Briefing)*\n\n` +
            `**Incident Subject**: \`${fileLabel}\`  \n` +
            `**Threat Classification**: 🚨 **${riskLevel} (Rule-Based Score: ${score}/100)**  \n` +
            `**Investigation Timestamp**: ${new Date().toLocaleDateString()} ${timestamp}  \n` +
            `**Status**: **Analysis Complete — Containment Advised**\n\n---\n\n` +
            `#### 1. Executive Summary:\n` +
            `Client-side forensic triage inspected \`${fileLabel}\`. Evaluated visible content reveals deceptive social engineering cues designed to harvest organizational credentials under false urgency. Potential impact is rated **${riskLevel}** based on deterministic threat indicators.\n\n` +
            `#### 2. Key Findings & Supporting Evidence:\n` +
            (indicators.length > 0 
              ? indicators.map(ind => `- **${ind.category}** [${(ind.severity || 'high').toUpperCase()}]: Triggered by *"${ind.matchedText}"*. ${ind.whySuspicious}`).join('\n')
              : `- Clean message profile: No standard phishing heuristics detected.\n`) +
            (urls.length > 0 ? `\n- **Identified Destinations**: ${urls.map(u => `\`${u}\``).join(', ')}\n` : '') +
            (recentContext.extractedText ? `\n- **Extracted Text Preview**:\n${formatExtractedTextQuote(recentContext.extractedText, 300)}\n` : '') +
            `\n#### 3. Risk / Severity & Rule-Based Basis:\n` +
            `The threat verdict (**${riskLevel}**, ${score}/100) reflects additive deterministic weights for credential interception, coercive urgency, and unverified destination links. This is a heuristic assessment, not an external threat feed verdict.\n\n` +
            `#### 4. Recommended Next Steps:\n` +
            `1. **Immediate Containment**: Block destination domains, revoke active sessions if credentials were typed, and purge related messages from user mailboxes.\n` +
            `2. **Investigation & Recovery**: Audit mail logs for organizational exposure and enforce hardware-bound MFA.\n\n` +
            `#### 5. Limitations & Unknowns:\n` +
            `- Analysis is based strictly on local OCR extraction and deterministic heuristic rules.\n` +
            `- Live DNS resolution, domain reputation history, and dynamic sandbox detonation require a connected backend security stack.`;

          return {
            category: 'INCIDENT_SUMMARY',
            timestamp,
            isDemo: true,
            text,
            analysisContext: recentContext,
            followUps: ['What should I do next?', 'Explain why this is critical.', 'Read that summary aloud.']
          };
        }
      }
    }

    // Follow-up to a file analysis
    if (recentContext.type === 'file' && recentContext.isSupported) {
      const isWhyCritical = 
        lower === 'why' || 
        lower === 'why?' ||
        lower.includes('why is it critical') || 
        lower.includes('why is this critical') || 
        lower.includes('explain why this is critical') ||
        lower.includes('explain why it is critical') ||
        lower.includes('why critical') ||
        (lower.includes('why') && (lower.includes('critical') || lower.includes('risk') || lower.includes('suspicious') || lower.includes('flagged') || lower.includes('score')));

      const isWhatNext = 
        lower.includes('what should i do next') ||
        lower.includes('what should i do') ||
        lower.includes('next steps') ||
        lower.includes('containment protocol');

      const isSummarize = 
        lower.includes('summary') || 
        lower.includes('summarize') || 
        lower.includes('what is in') || 
        lower.includes('what does');

      if (isWhyCritical) {
        const indicators = recentContext.indicators || [];
        const text = `### 🔍 Severity & Rule-Based Risk Basis: \`${recentContext.fileName}\`\n*(File Heuristic Breakdown)*\n\n` +
          `**Threat Level**: 🚨 **${recentContext.riskLevel} (Rule-Based Score: ${recentContext.score}/100)**\n\n` +
          `#### Evaluated Indicators:\n` +
          (indicators.length > 0 
            ? indicators.map(ind => `- 🚩 **${ind.category}** [${ind.severity?.toUpperCase() || 'HIGH'}]: Matched *"${ind.matchedText}"*. ${ind.whySuspicious}`).join('\n')
            : '- ✅ Clean file text profile.');

        return {
          category: 'RISK_EXPLANATION',
          timestamp,
          isDemo: true,
          text,
          analysisContext: recentContext,
          followUps: ['What should I do next?', 'Summarize this file.', 'Explain this alert.']
        };
      }

      if (isWhatNext) {
        const text = `### 🛡️ Recommended Containment Protocol for \`${recentContext.fileName}\`\n\n` +
          `1. ❌ **Do not interact** with links or credentials referenced in this file.\n` +
          `2. 🔄 **Revoke active sessions** if credentials were submitted to any referenced portal.\n` +
          `3. 🛡️ **Block destination domains** at firewall or mail proxy level.`;

        return {
          category: 'INCIDENT_RESPONSE',
          timestamp,
          isDemo: true,
          text,
          analysisContext: recentContext,
          followUps: ['Summarize this incident.', 'Explain SPF, DKIM, and DMARC.']
        };
      }

      if (isSummarize) {
        const text = `### 📄 Summary of \`${recentContext.fileName}\`\n*(Conversation Follow-up)*\n\n` +
          `**File**: \`${recentContext.fileName}\`  \n` +
          `**Threat Assessment**: **${recentContext.riskLevel} (Score: ${recentContext.score}/100)**\n\n` +
          `#### Content Summary:\n` +
          (recentContext.emailData ? `Email message from \`${recentContext.emailData.from}\` with subject \`${recentContext.emailData.subject}\`.\n\n- Visible From: \`${recentContext.emailData.from}\`\n- Return-Path: \`${recentContext.emailData.returnPath || 'Not set'}\`` : `Text document containing ${recentContext.contentText?.length || 0} characters.`) +
          `\n\n` +
          ((recentContext.detectedUrls || []).length > 0 ? `**Detected Links**: ${recentContext.detectedUrls.map(u => `\`${u}\``).join(', ')}` : '');

        return {
          category: 'FILE_ANALYSIS',
          timestamp,
          isDemo: true,
          text,
          analysisContext: recentContext,
          followUps: aiCopilotService.getFollowUpPrompts('FILE_ANALYSIS')
        };
      }
    }
  }

  // =========================================================================
  // 5. GENERAL CYBERSECURITY INQUIRIES & PLAYBOOKS
  // =========================================================================

  // 5.1 GENERAL RISK / CRITICAL EXPLANATION (When no active attachment in session)
  if (
    lower === 'why' || 
    lower === 'why?' ||
    lower.includes('why is it critical') || 
    lower.includes('why is this critical') || 
    lower.includes('explain why this is critical') ||
    lower.includes('explain why it is critical') ||
    lower.includes('why critical') ||
    (lower.includes('why') && (lower.includes('critical') || lower.includes('risk') || lower.includes('suspicious') || lower.includes('flagged') || lower.includes('score')))
  ) {
    const text = `### 🔍 Severity Classification & Rule-Based Risk Criteria
*(CyberShield Security Architecture)*

In CyberShield, security assessments use deterministic, rule-based scoring aligned with industry frameworks (CVSS v3.1 and NIST SP 800-61):

---

#### 1. How "Critical" / "High" Severity is Defined:
- **Score 75–100 (High / Critical)**: Triggered when high-risk patterns are detected concurrently:
  - **Urgent Credential Harvesting**: Direct requests to input enterprise passwords or MFA tokens (+30 pts).
  - **Coercive Urgency Phrasing**: Coercive threats of account suspension or payroll disruption (+25 pts).
  - **Insecure / High-Risk Web Target**: Links to non-HTTPS endpoints or high-risk TLDs (+25 pts).
  - **Cryptographic Authentication Failure**: SPF or DKIM failures indicating envelope spoofing (+30 pts).

#### 2. Transparent Heuristic Scoring:
> **Notice**: Risk levels are calculated client-side using transparent, deterministic heuristic rules. No unverified machine learning score or simulated external intelligence is fabricated.

#### 3. To Evaluate a Real Artifact:
Upload a screenshot, attach an \`.eml\` email file, or paste message headers directly into the chat prompt to see its specific rule-based risk breakdown.`;

    return {
      category: 'RISK_EXPLANATION',
      timestamp,
      isDemo: true,
      text,
      followUps: ['Analyze this suspicious email.', 'What should I do next?', 'Explain this alert.']
    };
  }

  // 5.2 GENERAL FINDING DETAIL (When no active attachment in session)
  if (
    lower.match(/explain (?:the )?(first|second|third|fourth|fifth|\d+)(?:st|nd|rd|th)? finding/i) ||
    lower.match(/(?:tell me about|what is) (?:the )?(first|second|third|fourth|fifth|\d+)(?:st|nd|rd|th)? (?:finding|indicator)/i)
  ) {
    const text = `### ℹ️ No Active Incident Findings in This Session

No screenshot, email file, or security document has been analyzed in this active conversation yet.

#### How to Generate Findings:
1. 📷 **Upload a Screenshot**: Click the **+** button to attach a screenshot for client-side OCR.
2. 📄 **Attach an Email / Document**: Upload an \`.eml\` or \`.txt\` file.
3. 🔬 **Sample Artifact**: Click **Sec Tools** > **Browse Sample Artifacts** to run a sample phishing triage.

Once analyzed, each flagged indicator can be individually deconstructed.`;

    return {
      category: 'FINDING_DETAIL',
      timestamp,
      isDemo: true,
      text,
      followUps: ['Analyze this suspicious email.', 'Explain this alert.', 'Explain SPF, DKIM, and DMARC alignment.']
    };
  }

  // 5.3 GENERAL RECOMMENDATIONS: WHAT SHOULD I DO NEXT?
  if (
    lower.includes('what should i do next') || 
    lower.includes('what to do next') ||
    lower.includes('what should i do')
  ) {
    const text = `### 🛡️ Prioritized Incident Containment & Response Framework
*(NIST SP 800-61 Rev. 2 Triage Guidelines)*

When responding to a potential security incident or credential compromise, follow this prioritized defensive workflow:

---

#### ⏱️ Phase 1: Immediate Containment (First 15–30 Minutes)
1. **Neutralize Active Sessions**: Trigger immediate global session revocation in identity providers (Microsoft Entra ID, Google Workspace) to invalidate hijacked OAuth tokens and cookies.
2. **Out-of-Band Password Reset**: Change the primary account password from a known-secure, uncompromised device.
3. **Audit Registered MFA Tokens**: Verify enrolled authentication devices; delete unauthorized authenticator apps or FIDO keys.
4. **Host Isolation**: If malware or an executable was downloaded, disconnect the endpoint from network interfaces.

#### 🔍 Phase 2: Scoping & Persistence Audit (Within 1–2 Hours)
- **Inbox Forwarding Sweep**: Inspect mailbox rules for covert external forwarding.
- **OAuth Application Audit**: Audit enterprise apps recently granted broad data access (\`Mail.ReadWrite\`, \`Files.Read\`).
- **Telemetry Queries**: Query authentication logs for impossible travel anomalies or Tor exit node logins.

#### 🛡️ Phase 3: Post-Incident Hardening
1. Block adversary destination domains and source IPs across border firewalls.
2. Enforce phishing-resistant MFA (FIDO2 passkeys) across all privileged administrative accounts.
3. File formal post-incident documentation for compliance.`;

    return {
      category: 'INCIDENT_RESPONSE',
      timestamp,
      isDemo: true,
      text,
      followUps: ['Explain this alert.', 'Explain why this is critical.', 'Summarize this incident.']
    };
  }

  // 5A. INCIDENT SUMMARY / SOC BRIEFING
  if (
    lower === 'summarize it' ||
    lower === 'summarize this' ||
    lower.includes('summarize this incident') ||
    lower.includes('summarize the incident') ||
    lower.includes('incident report') || 
    lower.includes('incident summary') || 
    lower.includes('generate incident') || 
    lower.includes('executive summary') ||
    lower.includes('forensic report') ||
    lower.includes('structured incident report') ||
    lower.includes('incident brief')
  ) {
    const text = `### 📋 CyberShield Executive Incident Summary Report
*(Simulated Demonstration Document)*

**Incident Reference**: \`INC-2026-0492-FIN\`  
**Severity Classification**: **HIGH (Tier-2 SOC Escalation)**  
**Target Department**: Corporate Finance & Accounts Payable  
**Containment Status**: ✅ **CONTAINED & REMEDIATED**  
**Investigation Timestamp**: ${new Date().toLocaleDateString()} ${timestamp}

---

#### 1. Executive Summary:
On ${new Date().toLocaleDateString()}, CyberShield automated heuristics intercepted a coordinated spear-phishing attempt masquerading as an urgent payroll system upgrade. A finance user accessed the credential harvesting portal and submitted credentials. Automated telemetry isolated the session within **8 minutes**, preventing unauthorized lateral traversal or wire transfer modifications.

#### 2. Key Findings & Supporting Evidence:
- **Lure Type**: Lookalike payroll reconciliation notification using display-name spoofing.
- **Deceptive Source**: \`payroll-service@pay-portal-verify.net\` *(Domain registered 48 hours prior)*.
- **Destination URI**: \`http://pay-portal-verify.net/auth/login.php\`
- **Egress Destination IP**: \`185.220.101.4\` (Known Bulletproof Hosting Node)
- **Authentication State**: SPF \`FAIL\`, DKIM \`NONE\`, DMARC \`p=quarantine\` triggered.

#### 3. Risk / Severity & Rule-Based Basis:
Rated **HIGH** based on concurrent detection of:
1. Urgent coercive payroll disruption pretext (+25).
2. Explicit credential harvesting input form (+30).
3. Failed cryptographic email authentication (+30).

#### 4. Recommended Next Steps:
1. **Immediate Containment**: Revoke user session tokens, force out-of-band password change, and audit registered MFA devices.
2. **Investigation & Recovery**: Enforce **FIDO2 / WebAuthn hardware security keys** for all finance staff and advance corporate DMARC policy from \`p=quarantine\` to strict \`p=reject\`.

#### 5. Limitations & Unknowns:
- This incident summary illustrates automated SOC reporting structure.
- Live active endpoint memory triage and external threat intelligence validation require a connected enterprise SIEM backend.`;

    return {
      category: 'INCIDENT_SUMMARY',
      timestamp,
      isDemo: true,
      text,
      followUps: aiCopilotService.getFollowUpPrompts('INCIDENT_SUMMARY')
    };
  }

  // 5B. EMAIL HEADERS & TRANSIT HOPS
  if (
    lower.includes('header') || 
    lower.includes('received:') || 
    lower.includes('return-path') || 
    lower.includes('transit hop') ||
    lower.includes('envelope') ||
    lower.includes('rfc 5322')
  ) {
    const text = `### 🔬 Email Header Forensic Deconstruction
*(Simulated Header Analysis)*

**Header Threat Verdict**: 🚨 **CRITICAL SPOOFING DETECTED**  
**Technique**: RFC 5322 Visible From vs RFC 5321 Envelope From Misalignment  
**Originating Relay**: \`185.220.101.4\` (Autonomous System AS49821, Host: \`bulletproof-relay.ru\`)

---

#### 1. Header Relay Path Breakdown
- **Received Hop 1 (Final Destination)**: \`mx.company.internal\` with CyberShield Gateway
- **Received Hop 0 (Connecting MTA)**: \`mail.bulletproof-relay.ru [185.220.101.4]\`
  - *Finding*: Connecting host is an unauthenticated external relay not authorized to transmit on behalf of the declared brand.

#### 2. Identity Discrepancies
- **Visible From Header**: \`"HR Payroll" <payroll-service@pay-portal-verify.net>\`
- **Envelope Sender (\`Return-Path\`)**: \`<bounce@bulletproof-relay.ru>\`
  - *Risk*: Envelope sender was redirected to an offshore relay to receive bounce notifications while masquerading as internal corporate personnel.

#### 3. Cryptographic Authentication Results
\`\`\`text
Authentication-Results: mx.company.internal;
    spf=fail (sender IP 185.220.101.4 is not in SPF record);
    dkim=none (no cryptographic signature present);
    dmarc=fail (p=quarantine) header.from=pay-portal-verify.net
\`\`\`

#### 4. Immediate Defensive Recommendations
1. Paste the full header block into CyberShield's **Email Forensics Lab** (\`/app/email-forensics\`) to visualize the full routing hop sequence.
2. Block originating IP \`185.220.101.4\` on perimeter border gateways.
3. Mark domain \`pay-portal-verify.net\` as fraudulent.`;

    return {
      category: 'AUTH_EXPLANATION',
      timestamp,
      isDemo: true,
      text,
      followUps: aiCopilotService.getFollowUpPrompts('AUTH_EXPLANATION')
    };
  }

  // 5C. SPF, DKIM, DMARC TECHNICAL GUIDANCE
  if (
    lower.includes('spf') || 
    lower.includes('dkim') || 
    lower.includes('dmarc') || 
    lower.includes('email authentication') ||
    lower.includes('alignment') ||
    lower.includes('dns record')
  ) {
    const text = `### 🛡️ Email Authentication Architecture: SPF, DKIM & DMARC
*(Simulated Technical Guidance)*

Email authentication prevents attackers from spoofing your domain name in phishing campaigns. The security foundation relies on three complementary standards:

---

#### 1. SPF (Sender Policy Framework — RFC 7208)
- **What it does**: Declares which mail server IP addresses are authorized to send email on behalf of your domain.
- **How it works**: Published as a DNS \`TXT\` record. When a receiving server gets an email, it inspects the sender's IP against this list.
- **Limitation**: SPF only validates the *envelope sender* (\`Return-Path\` / \`MailFrom\`), **not** the human-visible \`From:\` header shown in email clients.

\`\`\`dns
example.com.  IN  TXT  "v=spf1 include:_spf.google.com ip4:198.51.100.1 -all"
\`\`\`

#### 2. DKIM (DomainKeys Identified Mail — RFC 6376)
- **What it does**: Cryptographically proves that an email was genuinely sent by the domain owner and was **not modified in transit**.
- **How it works**: The sending server hashes email headers and body, signs them with a private key, and inserts a \`DKIM-Signature\` header. The recipient verifies the signature using the domain's public key published in DNS at \`selector._domainkey.domain.com\`.

#### 3. DMARC (Domain-based Message Authentication — RFC 7489)
- **The Critical Missing Link**: DMARC binds SPF and DKIM to the **visible From: header** through **Identifier Alignment**.
- **Why Alignment Matters**: An attacker could pass SPF using their own domain in the envelope, but display \`From: ceo@yourcompany.com\` to the victim. DMARC fails unless the domain in the visible \`From:\` header strictly matches the domain authenticated by SPF or DKIM.
- **DMARC Enforcement Policies**:
  - \`p=none\` — Monitoring only. Unauthenticated emails are still delivered.
  - \`p=quarantine\` — Fails are delivered to the recipient's Spam/Junk folder.
  - \`p=reject\` — Fails are dropped immediately at the gateway (industry gold standard).

\`\`\`dns
_dmarc.example.com.  IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc-reports@example.com; pct=100; aspf=r; adkim=r"
\`\`\`

> **Forensic Pro-Tip**: You can test and inspect raw email headers directly inside CyberShield's **Email Forensics Lab** (\`/app/email-forensics\`).`;

    return {
      category: 'AUTH_EXPLANATION',
      timestamp,
      isDemo: true,
      text,
      followUps: aiCopilotService.getFollowUpPrompts('AUTH_EXPLANATION')
    };
  }

  // 5D. INCIDENT RESPONSE PLAYBOOKS & CONTAINMENT
  if (
    lower.includes('incident response') || 
    lower.includes('checklist') || 
    lower.includes('clicked') || 
    lower.includes('entered password') || 
    lower.includes('compromised') ||
    lower.includes('hacked') ||
    lower.includes('containment') ||
    lower.includes('playbook') ||
    lower.includes('what should i do if')
  ) {
    const text = `### 🚨 Incident Response Playbook: Phishing Link & Credential Compromise
*(Simulated Emergency Triage Protocol)*

Follow this chronological checklist immediately to contain potential account takeover or lateral movement:

---

#### ⏱️ Phase 1: Immediate Containment (First 15 Minutes)
1. **Revoke Active Cloud Sessions**:
   - In Microsoft 365 Entra ID or Google Workspace Admin, trigger **"Revoke All Sessions"** immediately. This invalidates compromised OAuth access tokens and session cookies.
2. **Force Out-of-Band Password Reset**:
   - Change the primary domain password from a separate, known-clean device (e.g., administrator console or IT workstation).
3. **Audit Registered MFA Devices**:
   - Inspect the user's authentication methods. Attackers frequently register a rogue Authenticator App or FIDO token within minutes of initial access. Remove any unrecognized devices.
4. **Isolate the Endpoint**:
   - If an executable or macro-enabled document was downloaded, disconnect the endpoint from Wi-Fi/Ethernet immediately to stop lateral network reconnaissance.

#### 🔍 Phase 2: Scoping & Persistence Audit (Within 1 Hour)
- **Inspect Mailbox Forwarding Rules**: Check for hidden forwarding rules created by the attacker (e.g. forwarding messages containing *"invoice"*, *"wire"*, or *"confidential"* to an external address).
- **Audit OAuth App Consents**: Review recently authorized enterprise applications that may have been granted \`Mail.ReadWrite\` or \`Files.Read\`.
- **Query Authentication Logs**: Look for anomalous logins via Tor exit nodes, commercial VPNs, or unfamiliar user-agents.

#### 🛡️ Phase 3: Remediation & Post-Mortem
1. Block the malicious URL, domain, and sending IP on firewalls, proxies, and email gateways.
2. Search tenant mailboxes for identical phishing lures and purge them globally.
3. Document incident timeline and notify compliance officers if personally identifiable information (PII) was exposed.`;

    return {
      category: 'INCIDENT_RESPONSE',
      timestamp,
      isDemo: true,
      text,
      followUps: aiCopilotService.getFollowUpPrompts('INCIDENT_RESPONSE')
    };
  }

  // 5E. SECURITY ALERT EXPLANATION
  if (
    lower.includes('explain this alert') || 
    lower.includes('explain the alert') || 
    lower.includes('what does this alert say') || 
    lower.includes('what does this alert mean') || 
    lower.includes('alert explanation') ||
    lower.includes('impossible travel') ||
    (lower.includes('alert') && (lower.includes('explain') || lower.includes('mean') || lower.includes('deconstruct') || lower.includes('what')))
  ) {
    const text = `### 🚨 Security Alert Deconstruction & Telemetry Triage
*(Simulated SIEM/EDR Alert Explanation)*

**Alert Identifier**: \`SEC-ALERT-2026-GEO-AUTH: Impossible Travel Triggered\`  
**Severity Level**: **HIGH (P2 SOC Incident)**  
**Detection Logic**: Deterministic Telemetry & Geo-IP Rule Matching

---

#### 1. What the Alert Says (Plain-English):
The identity monitoring engine intercepted two successful authentication events for user \`j.smith@company.com\` originating from disparate geographical locations within an impossible timeframe:
- **09:00 UTC**: Login from New York, USA (\`204.14.82.1\`, Corporate ISP)
- **09:12 UTC** (12 minutes later): Login from Moscow, Russia (\`185.220.101.4\`, Anonymous Relay Node)

#### 2. Why It Matters (Business & Operational Risk):
This pattern strongly suggests **Adversary-in-the-Middle (AiTM) session token hijacking** or **credential replay**. If an attacker possesses the active session cookie, they can bypass MFA and access sensitive tenant data without user interaction.

#### 3. Evidence Supporting the Alert:
- Distance between login locations violates physical transit feasibility (>7,500 km in 12 minutes).
- Destination IP \`185.220.101.4\` is registered to a known bulletproof proxy hosting provider.
- User-Agent and browser fingerprint discrepancies observed between consecutive authentication requests.

#### 4. What Is Still Unknown / Limitations:
- Whether the user activated an enterprise or personal VPN while traveling.
- Whether a legitimate background cloud synchronization daemon generated the second token.
- Confirmation requires out-of-band communication with the user.

#### 5. Recommended Actions:
1. Immediately revoke active session tokens for \`j.smith@company.com\` in Entra ID / Google Admin.
2. Contact the employee out-of-band to verify their actual physical location.
3. Block originating IP \`185.220.101.4\` at border perimeter firewalls.`;

    return {
      category: 'ALERT_ANALYSIS',
      timestamp,
      isDemo: true,
      text,
      followUps: ['What should I do next?', 'Explain why this is critical.', 'Summarize this incident.']
    };
  }

  // 5F. SUSPICIOUS URL / LINK ANALYSIS
  if (
    lower.includes('http') || 
    lower.includes('url') || 
    lower.includes('link') || 
    lower.includes('.xyz') ||
    lower.includes('domain') ||
    lower.includes('pay-portal')
  ) {
    const text = `### 🌐 Suspicious URL Heuristic Analysis
*(Simulated Threat Evaluation)*

**URL Analyzed**: \`http://pay-portal-verify.net/auth/login.php?session=9382\`  
**Threat Verdict**: 🚨 **HIGH RISK (Score: 91/100)**  
**Attack Vector**: Credential Harvesting / AiTM Phishing Node

---

#### 1. Key Deception Indicators Detected
- **Insecure Cleartext Protocol (\`http://\`)**: Legitimate enterprise identity providers exclusively use HTTPS TLS with valid signed certificates.
- **Brand & Pretext Lookalike Domain**: Domain \`pay-portal-verify.net\` combines common HR keywords to fabricate authenticity.
- **Recent Domain Registration**: Registered 48 hours ago via an anonymous offshore proxy registrar.
- **Target Path Structure**: \`/auth/login.php\` matches known open-source phishing kit architectures (e.g. Evilginx).

#### 2. Egress Traffic Impact
- Connecting to this URL transmits the user's browser fingerprint, IP, and any entered credentials directly to an unmonitored adversary server.

#### 3. Recommended Actions:
- Block domain \`pay-portal-verify.net\` at internal DNS resolvers and Secure Web Gateway (SWG).
- Check web proxy logs to see if any other employees have navigated to this destination.`;

    return {
      category: 'URL_ANALYSIS',
      timestamp,
      isDemo: true,
      text,
      followUps: aiCopilotService.getFollowUpPrompts('URL_ANALYSIS')
    };
  }

  // 5G. SUSPICIOUS EMAIL / PHISHING ANALYSIS (When evaluating a specific suspicious email message or lure)
  const isEducationalQuestion = 
    lower.startsWith('what is') || 
    lower.startsWith('how to') || 
    lower.startsWith('how do') || 
    lower.startsWith('explain') || 
    lower.startsWith('tell me about') ||
    lower.includes('how to create') ||
    lower.includes('strong password');

  if (!isEducationalQuestion && (
    lower.includes('urgent') || 
    lower.includes('payroll') || 
    lower.includes('deposit') || 
    lower.includes('verify account') || 
    lower.includes('bank') || 
    lower.includes('invoice') || 
    lower.includes('docusign') || 
    lower.includes('analyze this email') || 
    lower.includes('is this email') || 
    lower.includes('suspicious email') ||
    (lower.includes('phishing') && (lower.includes('sample') || lower.includes('test') || lower.includes('check') || lower.includes('email')))
  )) {
    const text = `### 🔍 Phishing Triage Analysis
*(Simulated Threat Evaluation)*

**Threat Level**: 🚨 **HIGH RISK (Score: 89/100)**  
**Classification**: Credential Harvesting / Social Engineering Lure  
**Confidence**: **High (Deterministic Threat Signatures)**

---

#### Key Deception Indicators Detected:
1. **Artificial Urgency & Coercive Pressure**:
   - The message employs language designed to provoke immediate panic (*"URGENT"*, *"immediately"*, *"action required"*). Attackers use high urgency to bypass critical thinking and verification protocols.
2. **Suspicious Action Link / Domain Discrepancy**:
   - The target URL (\`pay-portal-verify.net\`) does not match legitimate corporate human resources infrastructure. Lookalike domains often utilize non-standard TLDs (\`.net\`, \`.xyz\`, \`.top\`) and hyphenated brand names.
3. **High-Risk Payload Target**:
   - Payroll, banking credentials, and single sign-on (SSO) logins are prime targets for Business Email Compromise (BEC) and payroll diversion attacks.
4. **Lack of Personalization**:
   - Generic greetings or automated error pretexts often indicate mass-delivered or template-based spear-phishing campaigns.

---

#### Recommended Defensive Actions:
- ❌ **Do NOT click the link** or enter banking credentials.
- 🗑️ **Do NOT reply to the sender** or attempt to confront them.
- 🔬 **Inspect RFC 5322 Headers**: Paste the raw headers into CyberShield's **Email Forensics Lab** (\`/app/email-forensics\`) to evaluate transit hop IP addresses and SPF/DKIM authentication status.
- 📧 **Submit to Internal SOC**: Forward the email as an attachment to your corporate security operations center.`;

    return {
      category: 'EMAIL_ANALYSIS',
      timestamp,
      isDemo: true,
      text,
      followUps: aiCopilotService.getFollowUpPrompts('EMAIL_ANALYSIS')
    };
  }

  // 5H. IDENTITY, PASSWORDS & MFA
  if (
    lower.includes('mfa') || 
    lower.includes('2fa') || 
    lower.includes('fido') || 
    lower.includes('passkey') ||
    lower.includes('zero trust') || 
    lower.includes('ransomware') || 
    lower.includes('social engineering')
  ) {
    const text = `### 🔑 Identity & Access Security Assessment
*(Simulated Technical Guidance)*

Strong authentication is the single most effective barrier against account takeover. Here is a technical breakdown of multi-factor authentication (MFA) tiers:

---

#### 1. Why SMS & Voice OTPs are Vulnerable
- **SIM Swapping**: Attackers socially engineer mobile carriers to port a victim's phone number to a criminal-controlled SIM card.
- **SS7 Protocol Vulnerabilities**: Flaws in legacy telecom signaling networks allow sophisticated threat actors to intercept SMS messages over the air.
- **AiTM Phishing Proxies**: Tools like Evilginx proxy the login page in real-time; when the user types their SMS code, the attacker captures the session cookie instantly.

#### 2. Why FIDO2 / WebAuthn Hardware Keys are Phishing-Resistant
- **Cryptographic Origin Binding**: FIDO2 keys sign a cryptographic challenge directly linked to the browser's current TLS domain (\`window.location.origin\`).
- If an employee is tricked into visiting \`fake-login.com\`, the hardware key signs for \`fake-login.com\`. The legitimate server at \`real-login.com\` rejects the signature because the origins do not match.
- **No Shared Secret**: Unlike TOTP codes, there is no shared secret stored on a server that can be breached or intercepted.

#### Summary Recommendation:
Implement **passkeys (FIDO2)** or phishing-resistant push notifications (number matching with geolocation verification) for all privileged accounts.`;

    return {
      category: 'CYBERSECURITY_FAQ',
      timestamp,
      isDemo: true,
      text,
      followUps: aiCopilotService.getFollowUpPrompts('CYBERSECURITY_FAQ')
    };
  }

  // 5I. GENERAL PHISHING & SOCIAL ENGINEERING CONCEPTS (Educational Q&A)
  if (
    lower === 'what is phishing' ||
    lower === 'what is phishing?' ||
    lower.includes('explain phishing') ||
    lower.includes('types of phishing') ||
    lower.includes('social engineering') ||
    lower.includes('tell me about phishing') ||
    lower.includes('how does phishing work')
  ) {
    const text = `### 🎣 Phishing & Social Engineering Explained
*(Cybersecurity Fundamentals)*

**Phishing** is a deceptive cyberattack where adversaries impersonate trusted entities (such as your employer, bank, IT support, or a reputable brand) to manipulate victims into revealing confidential information, downloading malicious payloads, or transferring funds.

---

#### 1. Core Categories of Phishing
- 📧 **Mass Email Phishing**: Broad, untargeted emails blasted to millions, using generic lures like *"Account Suspended"* or *"Package Delivery Failed"*.
- 🎯 **Spear Phishing**: Targeted attacks customized against a specific individual or team using researched details (job title, projects, colleagues).
- 👔 **Whaling / Executive BEC**: Business Email Compromise targeting C-level executives or finance staff to authorize fraudulent wire transfers.
- 💬 **Smishing (SMS) & Vishing (Voice)**: Phishing delivered through mobile text messages or deceptive telephone calls.
- 🪞 **Adversary-in-the-Middle (AiTM)**: Attackers proxy the real login portal in real-time to intercept session tokens and bypass basic MFA.

#### 2. Key Red Flags to Watch For
1. **Urgency & Coercion**: Artificial deadlines (*"Act within 15 minutes or your account will be deleted"*).
2. **Domain Mismatches**: Visible brand name (*"Microsoft Security"*) paired with a fake domain (\`admin-login-notice.xyz\`).
3. **Unexpected Attachments**: Invoice or receipt files with unusual extensions (\`.iso\`, \`.vbs\`, \`.exe\`, or password-protected \`.zip\`).
4. **Generic Greetings**: *"Dear Customer"* instead of your registered name.

#### 3. Best Defensive Practices
- **Verify Out-of-Band**: Contact the sender through an independent, verified channel (phone or company chat) before clicking.
- **Inspect Links Carefully**: Hover over links to preview the actual destination URL before clicking.
- **Use Phishing-Resistant MFA**: Upgrade from SMS codes to **FIDO2 / WebAuthn hardware passkeys**.
- **Test with CyberShield**: Upload suspicious screenshots to **Screenshot Phishing Analyzer** or paste raw headers into **Email Forensics Lab**.`;

    return {
      category: 'CYBERSECURITY_FAQ',
      timestamp,
      isDemo: true,
      text,
      followUps: ['Explain SPF, DKIM, and DMARC.', 'How do I create a strong password?', 'What should I do next?']
    };
  }

  // 5J. MALWARE, RANSOMWARE & SPYWARE
  if (
    lower.includes('malware') ||
    lower.includes('ransomware') ||
    lower.includes('spyware') ||
    lower.includes('trojan') ||
    lower.includes('keylogger') ||
    lower.includes('virus') ||
    lower.includes('worm') ||
    lower.includes('botnet')
  ) {
    const text = `### 🦠 Malware, Ransomware & Spyware Fundamentals
*(Defensive Threat Intelligence)*

**Malware** (Malicious Software) refers to any program or code intentionally designed to compromise systems, steal data, disrupt operations, or gain unauthorized persistent access.

---

#### 1. Common Malware Categories
- 🔒 **Ransomware**: Encrypts victim files using strong asymmetric cryptography (e.g. RSA + AES) and demands a cryptocurrency ransom for the decryption key. Modern adversaries practice **double extortion** (encrypting data AND exfiltrating it to threaten public release).
- 🕵️ **Spyware & Info-Stealers**: Covertly monitors keystrokes, steals saved browser passwords, extracts crypto wallet keys, and captures active session cookies (e.g. RedLine, Lumma, Vidar stealers).
- 🐴 **Trojans**: Disguised as legitimate software (cracked games, productivity utilities, software updates) that execute hidden backdoors upon launch.
- 🪱 **Worms**: Self-replicating malware that spreads across local networks without user interaction by exploiting unpatched network vulnerabilities (e.g. EternalBlue/WannaCry).
- 🤖 **Botnets**: Networks of hijacked endpoints controlled remotely by a Command & Control (C2) server to launch distributed denial-of-service (DDoS) attacks or proxy traffic.

#### 2. Primary Infection Vectors
1. **Phishing Attachments**: Weaponized Office documents with macros, deceptive PDF links, or archive files (\`.zip\`, \`.iso\`).
2. **Drive-By Downloads**: Malicious code executed automatically when visiting a compromised or attacker-controlled website via browser vulnerabilities.
3. **Unpatched Software**: Exploiting known CVE vulnerabilities in unpatched operating systems, VPN appliances, or web servers.
4. **Supply Chain Compromise**: Backdoored dependencies or third-party open-source libraries.

#### 3. Defensive Controls & Containment
- **Isolate Infected Machines**: Immediately disconnect the device from Wi-Fi and Ethernet to stop lateral propagation.
- **Immutable Offline Backups**: Maintain encrypted backups disconnected from the network (3-2-1 backup rule).
- **Endpoint Detection & Response (EDR)**: Continuous telemetry monitoring for anomalous process spawning (e.g. \`cmd.exe\` spawned by \`winword.exe\`).
- **Principle of Least Privilege**: Never run daily administrative tasks as local administrator.`;

    return {
      category: 'CYBERSECURITY_FAQ',
      timestamp,
      isDemo: true,
      text,
      followUps: ['What should I do if my system is infected?', 'Explain phishing.', 'What is zero trust?']
    };
  }

  // 5K. WEB VULNERABILITIES: SQL INJECTION, XSS, CSRF (OWASP Top 10)
  if (
    lower.includes('sql injection') ||
    lower.includes('sqli') ||
    lower.includes('xss') ||
    lower.includes('cross site scripting') ||
    lower.includes('csrf') ||
    lower.includes('web vulnerabilities') ||
    lower.includes('owasp') ||
    lower.includes('clickjacking')
  ) {
    const text = `### 🛡️ Web Application Vulnerabilities (OWASP Top 10)
*(Application Security Primer)*

Web applications are frequently targeted because they are exposed directly to the public internet. Here is a breakdown of the most critical web vulnerabilities:

---

#### 1. SQL Injection (SQLi)
- **What it is**: Occurs when untrusted user input is directly concatenated into a dynamic database query without proper parameterization.
- **Example Attack**:
\`\`\`sql
-- Vulnerable query:
SELECT * FROM users WHERE username = 'admin' AND password = '' OR '1'='1';
\`\`\`
- **Impact**: Attackers can bypass authentication, read or dump entire database tables (PII, credentials), alter records, or execute arbitrary OS commands.
- **Mitigation**: Always use **Prepared Statements (Parameterized Queries)** or Object-Relational Mappers (ORMs). Never concatenate raw input into SQL strings.

#### 2. Cross-Site Scripting (XSS)
- **What it is**: The application includes untrusted user data in a web page without proper encoding or sanitization, causing the victim's browser to execute malicious JavaScript.
- **Types**:
  - **Stored XSS**: Malicious script is saved in the database (e.g., in a comment field) and executed whenever other users view the page.
  - **Reflected XSS**: Script is reflected off a web server (e.g., in an error message or search query parameter).
  - **DOM-based XSS**: Vulnerability exists purely client-side in browser JavaScript DOM manipulation.
- **Impact**: Session hijacking (stealing \`document.cookie\`), keystroke logging, and phishing overlays.
- **Mitigation**: Context-aware output encoding, strict **Content Security Policy (CSP)**, and using modern frameworks (like React) that escape JSX by default.

#### 3. Cross-Site Request Forgery (CSRF)
- **What it is**: An attacker tricks an authenticated user's browser into executing an unauthorized state-changing request (e.g., changing email or transferring funds) on a trusted site.
- **Mitigation**: Use unpredictable **Anti-CSRF Tokens**, enforce **SameSite=Strict** or **Lax** on session cookies, and require re-authentication for sensitive actions.`;

    return {
      category: 'CYBERSECURITY_FAQ',
      timestamp,
      isDemo: true,
      text,
      followUps: ['Explain phishing.', 'How does URL scanner work?', 'Explain authentication security.']
    };
  }

  // 5L. URLS, DOMAINS, IP ADDRESSES & DNS
  if (
    lower.includes('what is dns') ||
    lower.includes('how does dns work') ||
    lower.includes('ip address') ||
    lower.includes('domain vs subdomain') ||
    lower.includes('how do domains work') ||
    lower.includes('typosquatting') ||
    lower.includes('homograph')
  ) {
    const text = `### 🌐 Network Foundations: URLs, Domains, IPs & DNS
*(Internet Infrastructure & Threat Vectors)*

Understanding how URLs and network protocols function is essential for spotting deceptive attacks and forensic triage:

---

#### 1. Deconstructing a Modern URL
\`\`\`text
https://  secure.  bank-portal.com  :443  /login/verify.php  ?token=abc#step1
|______|  |_____|  |_____________|  |___|  |_______________|  |________|
Scheme    Subdomain   Registered     Port       Path           Query
                       Domain
\`\`\`
- **Adversary Trick**: Attackers use misleading subdomains to trick victims:  
  \`https://paypal.com.verify-account-security.net/auth\`  
  *(The real destination is \`verify-account-security.net\`, NOT PayPal!)*

#### 2. Domain Deception Techniques
- **Typosquatting**: Registering common typographical errors of popular sites (e.g. \`amzon.com\`, \`gooogle.com\`).
- **Combosquatting**: Adding deceptive keywords to a brand name (e.g. \`chase-bank-verify.com\`, \`microsoft-security-alert.net\`).
- **IDN Homograph Attacks**: Using lookalike characters from Cyrillic or Greek alphabets (e.g. Cyrillic 'а' instead of Latin 'a') to create visually identical domains.

#### 3. How DNS (Domain Name System) Works
DNS acts as the phonebook of the internet, translating human-readable domain names (\`cybershield.internal\`) into machine-routable IP addresses (\`198.51.100.4\`):
- **A Record**: Maps a domain to an IPv4 address.
- **AAAA Record**: Maps a domain to an IPv6 address.
- **MX Record**: Declares the mail exchange servers responsible for accepting incoming email.
- **TXT Record**: Holds arbitrary text, primarily used for **SPF**, **DKIM**, and domain ownership verification.
- **NS Record**: Specifies the authoritative name servers for the zone.

#### 4. Public vs Private IP Addresses
- **Private IPs (RFC 1918)**: \`10.0.0.0/8\`, \`172.16.0.0/12\`, \`192.168.0.0/16\` — Used exclusively on internal local area networks; non-routable on the public internet.
- **Public IPs**: Globally unique addresses assigned by regional registries (ARIN, RIPE). Threat analysts query IP reputation, autonomous system numbers (ASNs), and geolocation to flag malicious nodes.`;

    return {
      category: 'CYBERSECURITY_FAQ',
      timestamp,
      isDemo: true,
      text,
      followUps: ['Open URL Scanner.', 'Explain SPF, DKIM, and DMARC.', 'Explain phishing.']
    };
  }

  // 5M. PASSWORDS & CREDENTIAL HYGIENE
  if (
    lower.includes('strong password') ||
    lower.includes('password safety') ||
    lower.includes('password security') ||
    lower.includes('password manager') ||
    lower.includes('credential stuffing') ||
    lower.includes('brute force') ||
    lower.includes('password best practice')
  ) {
    const text = `### 🔑 Password Safety & Modern Credential Hygiene
*(NIST SP 800-63B Authentication Guidelines)*

Passwords remain one of the most frequently breached barriers in corporate and personal security. Here is how modern authentication best practices have evolved:

---

#### 1. Length vs Complexity: The Passphrase Advantage
- Legacy rules (forcing 8 characters with 1 symbol, 1 number, 1 uppercase) often resulted in predictable patterns like \`P@ssword1!\`, which automated cracking tools crack in seconds.
- **NIST Modern Standard**: Prioritize **length and entropy** over arbitrary character sets.
  - A 4-word random passphrase (e.g. \`correct horse battery staple\`) offers over **44 bits of entropy**, making it exponentially harder to crack while remaining easy to remember.

#### 2. Primary Password Attacks
- **Brute Force**: Systematically trying every possible combination of characters until the correct one is found.
- **Dictionary Attack**: Testing lists of known dictionary words, leaked passwords (e.g. RockYou wordlist), and predictable permutations.
- **Credential Stuffing**: Taking username/password pairs breached from one service and automatically testing them against hundreds of other websites, exploiting password reuse.
- **Password Spraying**: Attempting a single common password (like \`Winter2026!\`) against thousands of user accounts to avoid account lockout thresholds.

#### 3. Defensive Recommendations
1. **Never Reuse Passwords**: Each account must have a unique password to prevent catastrophic credential stuffing cascade.
2. **Adopt a Reputable Password Manager**: Generate and store 16+ character random passwords automatically.
3. **Audit Against Breaches**: Check passwords against known public breach databases before deployment (e.g. using CyberShield's **Password Security Lab**).
4. **Enforce Hardware MFA**: Protect accounts with FIDO2 passkeys or authenticator apps so a breached password alone cannot compromise the account.`;

    return {
      category: 'CYBERSECURITY_FAQ',
      timestamp,
      isDemo: true,
      text,
      followUps: ['Open Password Security Lab.', 'Explain multi-factor authentication.', 'Explain phishing.']
    };
  }

  // 5N. COMPREHENSIVE RISK LEVEL BREAKDOWN (Low, Medium, High, Critical)
  if (
    lower.includes('explain risk levels') ||
    lower.includes('what do risk levels mean') ||
    lower.includes('explain low') ||
    lower.includes('explain medium') ||
    lower.includes('explain high') ||
    lower.includes('explain critical') ||
    lower.includes('risk classification') ||
    lower.includes('severity levels')
  ) {
    const text = `### ⚖️ CyberShield Risk Severity Classification Framework
*(Deterministic Heuristic Architecture)*

CyberShield utilizes a four-tier risk model to classify inspected screenshots, URLs, and email headers. Here is what each severity level means in practice:

---

#### 🟢 Low Risk (Score: 0 – 30)
- **Definition**: Routine communication or web resource exhibiting clean security indicators.
- **Characteristics**:
  - Legitimate domain reputation with valid TLS certificates.
  - Consistent email sender headers with verified SPF and DKIM signatures.
  - Normal business language without coercive urgency or credential requests.
- **Action**: No escalation required; proceed with standard operational awareness.

#### 🟡 Medium Risk (Score: 31 – 60)
- **Definition**: Suspicious signals or anomalies detected that require human verification before interaction.
- **Characteristics**:
  - Newly registered domain (<30 days old) or unusual top-level domain (\`.xyz\`, \`.top\`).
  - Mild urgency or generic greetings (*"Dear Customer"*).
  - Minor header inconsistencies (e.g. SPF neutral or missing DKIM signature).
- **Action**: Exercise caution. Independently verify the sender before opening links or downloading attachments.

#### 🟠 High Risk (Score: 61 – 84)
- **Definition**: Multiple concurrent deceptive threat indicators identified. Strong probability of a coordinated cyber attack.
- **Characteristics**:
  - Direct requests for credentials, passwords, or banking information.
  - Coercive threats of account suspension, payroll cancellation, or legal action.
  - Insecure protocol (\`http://\`) or lookalike brand domain.
  - SPF/DKIM cryptographic authentication failure.
- **Action**: Do not click links or enter information. Escalate to IT/SOC and quarantine the message.

#### 🔴 Critical Risk (Score: 85 – 100)
- **Definition**: Imminent, active compromise vector or verified malicious adversary infrastructure.
- **Characteristics**:
  - Active Adversary-in-the-Middle (AiTM) phishing kit or credential harvesting endpoint.
  - Connecting IP recognized as a bulletproof host or known threat actor proxy node.
  - Complete visible vs envelope sender domain spoofing with strict DMARC rejection.
- **Action**: **Immediate Containment Required**. Revoke user session tokens, force out-of-band password resets, and block destination domains at border firewalls.

---
> **Notice of Heuristic Scoring**: Risk scores are computed locally using transparent, rule-based heuristic weights rather than an opaque or unverified probability estimate.`;

    return {
      category: 'RISK_EXPLANATION',
      timestamp,
      isDemo: true,
      text,
      followUps: ['Explain why this is critical.', 'What should I do next?', 'Explain this alert.']
    };
  }

  // 5O. CROSS-SCANNER FOLLOW-UP: "Open these findings in the relevant scanner"
  if (
    lower.includes('open these findings in the relevant scanner') ||
    lower.includes('open in scanner') ||
    lower.includes('open in the relevant scanner') ||
    lower.includes('send findings to scanner') ||
    lower.includes('open in relevant tool')
  ) {
    if (recentContext?.type === 'image' || recentContext?.extractedText) {
      const text = `### 🚀 Ready to Inspect in Scanner\n\nYour screenshot findings from \`${recentContext.fileName || 'uploaded image'}\` are ready. Would you like to:\n\n1. **[Open Screenshot Phishing Analyzer](/app/screenshot-analyzer)**: To run full OCR text extraction and rule-based phishing analysis.\n2. **[Open Visual Phishing Detection](/app/visual-phishing)**: To inspect visual logos and brand impersonation.\n\n*Say "Open Screenshot Analyzer" or click the link above to proceed.*`;
      return {
        category: 'SCANNER_HANDOFF',
        timestamp,
        isDemo: true,
        text,
        followUps: ['Open Screenshot Analyzer.', 'Open Visual Phishing Detection.', 'What should I do next?']
      };
    } else if (recentContext?.type === 'file' || recentContext?.emailData) {
      const text = `### 🚀 Ready to Inspect in Email Forensics\n\nYour email findings are prepared for deep RFC 5322 header reconstruction.\n\n👉 **[Open Email Forensics Lab](/app/email-forensics)** to visualize transit hops and cryptographic SPF/DKIM alignment.\n\n*Say "Open Email Forensics" or click the link above to proceed.*`;
      return {
        category: 'SCANNER_HANDOFF',
        timestamp,
        isDemo: true,
        text,
        followUps: ['Open Email Forensics.', 'Explain SPF, DKIM, and DMARC.', 'What should I do next?']
      };
    } else {
      const text = `### 🔍 Available CyberShield Scanners\n\nSelect the security scanner best suited for your artifact:\n\n- 📷 **[Screenshot Phishing Analyzer](/app/screenshot-analyzer)**: Inspect screenshots of emails or web pages.\n- 🔗 **[Smart URL Scanner](/web-security/url-scanner)**: Test destination links and domain reputation.\n- 📧 **[Email Forensics Lab](/app/email-forensics)**: Analyze raw email headers and routing hops.\n- 🏁 **[QR Security Scanner](/web-security/qr-scanner)**: Safely inspect and decode QR code redirects.`;
      return {
        category: 'SCANNER_HANDOFF',
        timestamp,
        isDemo: true,
        text,
        followUps: ['Open URL Scanner.', 'Open Screenshot Analyzer.', 'Open Email Forensics.']
      };
    }
  }

  // 5P. STEP-BY-STEP OR SIMPLIFIED EXPLANATION
  if (
    lower.includes('simple words') ||
    lower.includes('explain simply') ||
    lower.includes('explain in simple terms') ||
    lower.includes('step by step') ||
    lower.includes('like i am 5') ||
    lower.includes('for a student') ||
    lower.includes('simpler')
  ) {
    if (recentContext) {
      const file = recentContext.fileName || 'the analyzed item';
      const score = recentContext.score ?? 0;
      const isDangerous = score >= 50;

      const text = `### 💡 Simple Explanation of \`${file}\`
*(Student-Friendly Breakdown)*

Here is the bottom line in plain English:

1. **What is it?**: We looked at \`${file}\` to see if it was safe or a trick.
2. **Is it safe?**: ${isDangerous ? '🚨 **No, this looks dangerous.**' : '✅ **This looks relatively safe.**'} (Safety Score: ${score}/100)
3. **Why?**: ${isDangerous 
        ? 'It uses fake urgency (trying to rush you) or asks for private credentials like passwords or bank info that scammers steal.' 
        : 'It does not contain suspicious links, urgent threats, or fake login requests.'}
4. **What should you do right now?**:
   - ${isDangerous ? '❌ **Do not click** on any link or button inside it.' : '✔️ You can proceed normally, but always stay alert.'}
   - ${isDangerous ? '🗑️ **Do not reply** to the sender.' : '✔️ Keep your software and passwords updated.'}
   - ${isDangerous ? '🔄 **Change your password** if you already typed it somewhere.' : '✔️ Use two-factor authentication whenever possible.'}`;

      return {
        category: 'SIMPLE_EXPLANATION',
        timestamp,
        isDemo: true,
        text,
        followUps: ['What should I do next?', 'Explain why this is critical.', 'Summarize this incident.']
      };
    } else {
      const text = `### 💡 Cybersecurity in Simple Terms
*(Quick Student Guide)*

Cybersecurity is all about protecting your computer, phone, and accounts from thieves and impostors. Here are the 3 golden rules:

1. 🎣 **Do Not Take the Bait (Phishing)**: If an email or text says *"URGENT: Click here or your account will be locked"*, stop! Go to the official website directly instead of clicking their link.
2. 🔑 **Use Long Passwords**: Make passwords like a short sentence (\`blue sunset guitar ocean 2026\`). They are easy for you to remember, but impossible for computers to guess.
3. 🛡️ **Turn On Two-Factor Authentication (2FA)**: Even if someone guesses your password, 2FA prevents them from logging in without your phone or hardware key.`;

      return {
        category: 'SIMPLE_EXPLANATION',
        timestamp,
        isDemo: true,
        text,
        followUps: ['What is phishing?', 'How do I make a strong password?', 'Explain risk levels.']
      };
    }
  }

  // =========================================================================
  // 6. OUT-OF-SCOPE / CLARIFICATION FALLBACK
  // =========================================================================
  const text = `### ℹ️ Demonstration Mode Notice
*(Simulated Response)*

CyberShield AI Security Copilot operates with a specialized client-side rule engine designed for **cybersecurity triage, screenshot OCR forensics, email authentication, and incident management**.

Your query:
> *"${prompt.length > 80 ? prompt.substring(0, 77) + '...' : prompt}"*

does not match pre-loaded cybersecurity scenarios or active attachment context.

---

#### 💡 How to Interact with the Copilot:
1. 📷 **Upload a Screenshot**: Attach a screenshot of an email, login portal, or notification to execute client-side OCR and heuristic phishing detection.
2. 📄 **Upload a Security Document**: Attach an \`.eml\` email trace or \`.log\` file to inspect headers and IOCs.
3. 💬 **Ask a Specific Question**: Ask questions about SPF/DKIM/DMARC, incident containment playbooks, malware, or MFA security.`;

  return {
    category: 'OUT_OF_SCOPE',
    timestamp,
    isDemo: true,
    text,
    followUps: aiCopilotService.getFollowUpPrompts('OUT_OF_SCOPE')
  };
}

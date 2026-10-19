/**
 * Email Forensics Analyzer Engine
 * 
 * Performs deterministic, explainable security evaluations on parsed email evidence:
 * - Authentication Evaluation (SPF, DKIM, DMARC)
 * - Sender & Domain Inconsistency Heuristics
 * - Multi-Hop Delivery Route Inspection
 * - Risk Assessment Scoring
 * - Evidence-Backed Defensive Guidance
 */

const KNOWN_BRANDS = [
  { name: 'PayPal', domain: 'paypal.com', match: /paypal/i },
  { name: 'Microsoft', domain: 'microsoft.com', match: /(microsoft|office\s*365|o365|outlook)/i },
  { name: 'Google', domain: 'google.com', match: /(google|gmail|workspace)/i },
  { name: 'Apple', domain: 'apple.com', match: /(apple|icloud)/i },
  { name: 'Amazon', domain: 'amazon.com', match: /(amazon|aws)/i },
  { name: 'Chase', domain: 'chase.com', match: /(chase\s*bank|jpmorgan)/i },
  { name: 'Bank of America', domain: 'bankofamerica.com', match: /(bank\s*of\s*america|bofa)/i },
  { name: 'DocuSign', domain: 'docusign.com', match: /docusign/i },
  { name: 'Wells Fargo', domain: 'wellsfargo.com', match: /wellsfargo/i },
  { name: 'Dropbox', domain: 'dropbox.com', match: /dropbox/i },
  { name: 'Netflix', domain: 'netflix.com', match: /netflix/i }
];

/**
 * Analyze parsed email model and generate structured forensic observations
 */
export function analyzeEmailForensics(parsedEmail) {
  if (!parsedEmail || !parsedEmail.isValid) {
    return null;
  }

  const {
    from,
    replyTo,
    returnPath,
    authResults,
    dkimSignatures = [],
    receivedHops = [],
    extractedUrls = []
  } = parsedEmail;

  const findings = [];
  let threatScore = 0;

  // 1. AUTHENTICATION EVIDENCE CHECKS
  const spfStatus = authResults.spf.status;
  const dkimStatus = authResults.dkim.status;
  const dmarcStatus = authResults.dmarc.status;

  // SPF Analysis
  if (spfStatus === 'FAIL') {
    threatScore += 30;
    findings.push({
      id: 'spf-fail',
      title: 'SPF Authorization Failure',
      severity: 'High',
      field: 'Authentication-Results (spf=fail)',
      explanation: 'The receiving server determined that the sending mail server IP is explicitly not authorized in the sender domain\'s SPF DNS record.',
      whyItMatters: 'SPF (Sender Policy Framework) prevents unauthorized servers from sending mail on behalf of a domain. A hard fail strongly suggests header spoofing.',
      recommendation: 'Treat this message with extreme caution. Do not trust the visible sender identity.'
    });
  } else if (spfStatus === 'SOFTFAIL') {
    threatScore += 20;
    findings.push({
      id: 'spf-softfail',
      title: 'SPF Softfail Reported',
      severity: 'Medium',
      field: 'Authentication-Results (spf=softfail)',
      explanation: 'The sending IP is not authorized by SPF, but the domain specifies a non-strict "~all" policy.',
      whyItMatters: 'While some legitimate mailing services configure softfail during transitions, phishers frequently exploit softfail to bypass spam filters.',
      recommendation: 'Verify the sending entity through alternative communication channels.'
    });
  }

  // DKIM Analysis
  if (dkimStatus === 'FAIL') {
    threatScore += 30;
    findings.push({
      id: 'dkim-fail',
      title: 'DKIM Cryptographic Signature Failure',
      severity: 'High',
      field: 'Authentication-Results (dkim=fail)',
      explanation: 'The cryptographic digital signature failed verification against the sender domain\'s public key, or the email was modified in transit.',
      whyItMatters: 'DKIM provides cryptographic proof of message integrity. A failing signature indicates either forgery or tampered headers/content.',
      recommendation: 'Reject or quarantine this message. Cryptographic verification could not confirm sender authenticity.'
    });
  }

  // DMARC Analysis
  if (dmarcStatus === 'FAIL') {
    threatScore += 35;
    findings.push({
      id: 'dmarc-fail',
      title: 'DMARC Domain Alignment & Policy Failure',
      severity: 'High',
      field: 'Authentication-Results (dmarc=fail)',
      explanation: 'DMARC evaluation failed. Neither SPF nor DKIM passed with domain alignment matching the visible "From" address.',
      whyItMatters: 'DMARC is the definitive protocol for preventing domain spoofing. When DMARC fails, the sender cannot legitimately claim the visible From domain.',
      recommendation: 'Enforce organization DMARC policy (Quarantine or Reject). Never provide credentials or click links.'
    });
  }

  // 2. SENDER & DOMAIN INCONSISTENCY CHECKS

  // From vs. Reply-To Mismatch
  if (replyTo && from.domain && replyTo.domain) {
    if (from.domain.toLowerCase() !== replyTo.domain.toLowerCase()) {
      const isFreeMailReply = /^(gmail|yahoo|outlook|hotmail|proton|protonmail|icloud|aol)\.com$/i.test(replyTo.domain);
      const isHighSeverity = isFreeMailReply || dmarcStatus === 'FAIL';
      
      threatScore += isHighSeverity ? 30 : 20;
      findings.push({
        id: 'reply-to-mismatch',
        title: `Mismatched Reply-To Address (@${replyTo.domain})`,
        severity: isHighSeverity ? 'High' : 'Medium',
        field: `From: ${from.address} ➔ Reply-To: ${replyTo.address}`,
        explanation: `Replies will be sent to "${replyTo.address}" instead of the visible sender "${from.address}".`,
        whyItMatters: 'Attackers frequently spoof legitimate corporate addresses in the "From" line while directing replies to a drop account they control.',
        recommendation: 'Do NOT use the "Reply" button. If responding is necessary, manually verify and type the authentic address.'
      });
    }
  }

  // From vs. Return-Path (Envelope Sender) Mismatch
  if (returnPath && from.domain && returnPath.domain) {
    if (from.domain.toLowerCase() !== returnPath.domain.toLowerCase()) {
      // Legitimate third party relays like SendGrid / Mailchimp often differ
      const isWellKnownRelay = /(sendgrid|mailchimp|amazonses|zendesk|salesforce|hubspot|constantcontact|cmail|sparkpost)/i.test(returnPath.domain);
      
      findings.push({
        id: 'return-path-mismatch',
        title: 'Envelope Sender (Return-Path) Differs from Visible From',
        severity: isWellKnownRelay ? 'Informational' : 'Low',
        field: `From: @${from.domain} ➔ Return-Path: @${returnPath.domain}`,
        explanation: `The technical bounce address (@${returnPath.domain}) differs from the author address (@${from.domain}).`,
        whyItMatters: isWellKnownRelay 
          ? 'Common in legitimate marketing newsletters and customer support platforms operating on behalf of a brand.'
          : 'May indicate message relaying through third-party infrastructure. Requires checking SPF alignment.',
        recommendation: 'Check SPF and DKIM pass status to confirm whether this third-party relay is authorized.'
      });
    }
  }

  // Display Name Brand Impersonation
  if (from.name && from.domain) {
    for (const brand of KNOWN_BRANDS) {
      if (brand.match.test(from.name) && !from.domain.endsWith(brand.domain)) {
        threatScore += 35;
        findings.push({
          id: `brand-spoof-${brand.name.toLowerCase()}`,
          title: `Brand Impersonation in Display Name ("${brand.name}")`,
          severity: 'High',
          field: `From: "${from.name}" <${from.address}>`,
          explanation: `The display name claims to represent ${brand.name}, but the email originates from "@${from.domain}", not ${brand.domain}.`,
          whyItMatters: 'Display Name Spoofing is the #1 visual phishing tactic on mobile clients, where users often see only the display name and not the actual domain.',
          recommendation: 'Never trust sender display names alone. Inspect the actual domain and verify directly with the organization.'
        });
        break;
      }
    }
  }

  // Free Webmail Corporate Pretender
  if (from.domain && /^(gmail|yahoo|outlook|hotmail|aol)\.com$/i.test(from.domain)) {
    const corporateKeywords = /(support|security|billing|admin|it-dept|verification|helpdesk|payroll|executive|ceo|director)/i;
    if (corporateKeywords.test(from.name) || corporateKeywords.test(from.address)) {
      threatScore += 25;
      findings.push({
        id: 'free-webmail-corporate',
        title: 'Corporate Security Title on Free Webmail Domain',
        severity: 'Medium',
        field: `From: ${from.raw}`,
        explanation: `The sender claims an administrative or security title from a public free email domain (@${from.domain}).`,
        whyItMatters: 'Legitimate institutions do not conduct official administrative or security business through free personal email accounts.',
        recommendation: 'Do not follow instructions provided in this communication. Report to your security operations team.'
      });
    }
  }

  // 3. ROUTING & RELAY ANOMALIES
  if (receivedHops.length === 0) {
    findings.push({
      id: 'no-received-headers',
      title: 'No Received Headers Present',
      severity: 'Informational',
      field: 'Received (0 hops)',
      explanation: 'No MTA relay hops were found in the supplied input. This may occur if only partial headers were pasted.',
      whyItMatters: 'Received headers provide the chronological chain of custody from origin MTA to recipient mailbox.',
      recommendation: 'Paste full raw headers including all "Received:" lines for complete hop-by-hop route analysis.'
    });
  } else {
    // Check for origin hop anomalies
    const originHop = receivedHops[0];
    if (originHop && originHop.ips && originHop.ips.length > 0) {
      const originIp = originHop.ips[0];
      // Check private vs public IP
      const isPrivate = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.)/.test(originIp);
      if (!isPrivate) {
        findings.push({
          id: 'origin-ip-recorded',
          title: `Originating Relay IP Identified (${originIp})`,
          severity: 'Informational',
          field: `Hop #1 Received: ${originHop.from || originIp}`,
          explanation: `The earliest recorded MTA hop identifies relay IP ${originIp}.`,
          whyItMatters: 'This IP represents the first mail server that submitted the message into the transit network.',
          recommendation: 'Verify if this IP address matches the sender\'s expected geography or infrastructure.'
        });
      }
    }
  }

  // 4. EXTRACTED URL ANOMALIES
  const suspiciousUrls = extractedUrls.filter(u => u.isIpAddress || u.isHttpOnly);
  if (suspiciousUrls.length > 0) {
    const hasIpUrl = suspiciousUrls.some(u => u.isIpAddress);
    threatScore += hasIpUrl ? 20 : 10;
    
    findings.push({
      id: 'suspicious-urls',
      title: hasIpUrl ? 'Direct IP Address Used in Embedded URL' : 'Unencrypted (HTTP) Hyperlink Detected',
      severity: hasIpUrl ? 'High' : 'Medium',
      field: `Extracted URLs (${suspiciousUrls.length} flagged)`,
      explanation: hasIpUrl 
        ? 'One or more URLs in this message bypass domain name resolution by using raw IP addresses.'
        : 'One or more links use plaintext HTTP instead of secure HTTPS.',
      whyItMatters: 'Legitimate institutions almost never distribute direct numeric IP links. This is a common evasion technique to bypass domain reputation blocklists.',
      recommendation: 'Do NOT click these links. Analyze suspicious URLs in CyberShield\'s Smart URL Scanner.'
    });
  }

  // Multi-Signal Escalation (Convergence Bonus)
  const highFindingsCount = findings.filter(f => f.severity === 'High').length;
  if (highFindingsCount >= 2) {
    threatScore += 10;
  }

  // Determine whether sufficient evidence exists to compute an objective forensic score
  const hasSenderEvidence = Boolean(from?.address || from?.domain);
  const hasAuthEvidence = Boolean(
    (authResults?.spf?.status && authResults.spf.status !== 'NONE') ||
    (authResults?.dkim?.status && authResults.dkim.status !== 'NONE') ||
    (authResults?.dmarc?.status && authResults.dmarc.status !== 'NONE') ||
    dkimSignatures.length > 0
  );
  const hasRoutingEvidence = receivedHops.length > 0;
  const hasAlignmentEvidence = Boolean(replyTo || returnPath);

  // Sufficient evidence requires sender identity PLUS at least one verifiable forensic signal
  const scoreAvailable = hasSenderEvidence && (hasAuthEvidence || hasRoutingEvidence || hasAlignmentEvidence);
  
  const finalScore = scoreAvailable ? Math.min(100, Math.max(0, threatScore)) : null;

  const scoreReason = scoreAvailable
    ? 'Heuristic Threat & Inconsistency Score based on observed cryptographic authentication (SPF/DKIM/DMARC), envelope alignment, and routing hops. (Not a definitive probability that the message is malicious).'
    : 'Score unavailable: Insufficient header evidence. The supplied input lacks sender envelope metadata, authentication results (SPF/DKIM/DMARC), or MTA routing hops required to compute a reliable score.';

  // Determine Overall Risk Classification based on available evidence and findings
  let riskVerdict;

  if (!scoreAvailable) {
    // Case 1: Header evidence is incomplete (e.g. missing From, Auth-Results, or Received lines)
    riskVerdict = {
      level: 'unavailable',
      label: 'Score Unavailable',
      color: 'text-text-muted',
      bg: 'bg-bg-surface',
      border: 'border-border',
      badge: 'text-text-muted bg-bg-surface border-border',
      summary: 'Insufficient header telemetry to calculate an objective threat score. Please paste complete RFC 5322 headers containing From, Received, or Authentication-Results lines.',
      verdict: 'Insufficient Evidence'
    };
  } else {
    // Check for critical security failures: DMARC rejection or known high-value brand spoofing
    const hasCriticalFailure = findings.some(f => 
      f.id === 'dmarc-fail' || 
      f.id === 'brand-spoof-paypal' || 
      f.id === 'brand-spoof-microsoft'
    );
    const isHighThreatScore = finalScore !== null && finalScore >= 60;

    // Check for medium/elevated risk indicators
    const isMediumThreatScore = finalScore !== null && finalScore >= 25;
    const hasMediumFindings = findings.some(f => f.severity === 'Medium');

    if (hasCriticalFailure || isHighThreatScore) {
      // Case 2: High risk - strong indicators of active spoofing or phishing
      riskVerdict = {
        level: 'high',
        label: 'HIGH RISK / SUSPECTED PHISHING',
        color: 'text-danger',
        bg: 'bg-danger/10',
        border: 'border-danger/30',
        badge: 'text-danger bg-danger/10 border-danger/30',
        summary: 'Multiple forensic indicators strongly suggest deliberate sender spoofing or phishing. Do not interact with this email.',
        verdict: 'Suspicious / High Risk'
      };
    } else if (isMediumThreatScore || hasMediumFindings) {
      // Case 3: Medium risk - partial authentication failures or minor discrepancies
      riskVerdict = {
        level: 'medium',
        label: 'SUSPICIOUS / ELEVATED RISK',
        color: 'text-warning',
        bg: 'bg-warning/10',
        border: 'border-warning/30',
        badge: 'text-warning bg-warning/10 border-warning/30',
        summary: 'Authentication inconsistencies or sender mismatches were observed. Independent verification is recommended.',
        verdict: 'Elevated Inconsistencies'
      };
    } else {
      // Case 4: Low risk - SPF, DKIM, and DMARC passed with domain alignment
      riskVerdict = {
        level: 'low',
        label: 'AUTHENTIC / LOW RISK',
        color: 'text-success',
        bg: 'bg-success/10',
        border: 'border-success/30',
        badge: 'text-success bg-success/10 border-success/30',
        summary: 'Authentication records (SPF/DKIM/DMARC) and sender identities passed verification with no critical inconsistencies detected.',
        verdict: 'Low Risk / Valid Authentication'
      };
    }
  }

  // Prioritized Defensive Guidance
  const recommendations = [];
  if (!scoreAvailable) {
    recommendations.push({
      priority: 1,
      directive: 'Provide Full Raw Headers',
      detail: 'Extract and paste the complete original message headers from your email client (including Received: and Authentication-Results: lines).'
    });
    recommendations.push({
      priority: 2,
      directive: 'Avoid Taking Action on Unknown Emails',
      detail: 'If this message requests financial or personal action, verify the communication through verified corporate channels.'
    });
  } else if (riskVerdict.level === 'high') {
    recommendations.push({
      priority: 1,
      directive: 'Quarantine or Delete Message',
      detail: 'Do not reply, click links, download attachments, or call phone numbers contained in this email.'
    });
    recommendations.push({
      priority: 2,
      directive: 'Alert Security Operations / IT',
      detail: 'Forward raw headers to your organization\'s security team so sender domains can be blocked at the mail gateway.'
    });
    recommendations.push({
      priority: 3,
      directive: 'Rotate Credentials If Action Taken',
      detail: 'If any passwords or 2FA codes were entered on links from this message, immediately change credentials from a known secure device.'
    });
  } else if (riskVerdict.level === 'medium') {
    recommendations.push({
      priority: 1,
      directive: 'Perform Out-of-Band Verification',
      detail: 'Contact the alleged sender through a verified telephone directory or official website, not through details in this message.'
    });
    recommendations.push({
      priority: 2,
      directive: 'Verify Embedded URLs Safely',
      detail: 'Analyze any suspicious links in CyberShield\'s Smart URL Scanner before navigating to them.'
    });
  } else {
    recommendations.push({
      priority: 1,
      directive: 'Maintain Standard Caution',
      detail: 'Authentication passed, but always exercise caution before sharing sensitive information or approving financial transactions.'
    });
  }

  return {
    threatScore: finalScore,
    scoreAvailable,
    scoreReason,
    risk: riskVerdict,
    riskVerdict,
    findings,
    recommendations,
    authentication: {
      spf: authResults?.spf || { status: 'NONE' },
      dkim: authResults?.dkim || { status: 'NONE' },
      dmarc: authResults?.dmarc || { status: 'NONE' },
      rawAuthResults: authResults?.raw || '',
      dkimSignaturePresent: dkimSignatures.length > 0,
      dkimSignatures,
      domainAlignment: {
        spfAligned: Boolean(from?.domain && authResults?.spf?.domain && from.domain.toLowerCase() === authResults.spf.domain.toLowerCase()),
        dkimAligned: Boolean(from?.domain && authResults?.dkim?.domain && from.domain.toLowerCase() === authResults.dkim.domain.toLowerCase())
      }
    },
    routing: {
      totalHops: receivedHops.length,
      originIp: receivedHops[0]?.ips?.[0] || receivedHops[0]?.fromHost || receivedHops[0]?.from || '',
      finalMxHost: receivedHops[receivedHops.length - 1]?.byHost || receivedHops[receivedHops.length - 1]?.by || '',
      hops: receivedHops.map((h, i) => ({
        ...h,
        hopNumber: i + 1,
        fromHost: h.fromHost || h.from || '',
        byHost: h.byHost || h.by || '',
        delayFromPreviousSec: h.delaySeconds ?? h.delayFromPreviousSec ?? null
      }))
    },
    urls: extractedUrls,
    senderDiscrepancies: {
      fromDomain: from?.domain,
      replyToDomain: replyTo?.domain,
      returnPathDomain: returnPath?.domain
    },
    stats: {
      totalFindings: findings.length,
      highSeverity: highFindingsCount,
      mediumSeverity: findings.filter(f => f.severity?.toLowerCase() === 'medium').length,
      lowSeverity: findings.filter(f => ['low', 'informational', 'info'].includes(f.severity?.toLowerCase())).length,
      hopsCount: receivedHops.length,
      urlsCount: extractedUrls.length
    }
  };
}

export const analyzeParsedEmail = analyzeEmailForensics;


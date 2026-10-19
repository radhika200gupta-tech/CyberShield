/**
 * Email Forensics Parser (RFC 5322 Compliant Client-Side Parser)
 * 
 * Safely parses raw email headers and messages on-device:
 * - Unfolds continuation lines (RFC 5322 section 2.2.3)
 * - Separates header block from body at the first empty line
 * - Reconstructs Mail Transfer Agent (MTA) hops from Received: headers
 * - Extracts address/domain pairs, DKIM signatures, and Authentication-Results
 * - Safely extracts embedded hyperlinks without network execution
 */

/**
 * Extract email address and domain from an address string
 * Examples:
 *   "PayPal Security" <alert@paypal-update.com> -> { name: "PayPal Security", address: "alert@paypal-update.com", domain: "paypal-update.com" }
 *   user@domain.com -> { name: "", address: "user@domain.com", domain: "domain.com" }
 */
export function parseEmailAddress(rawString) {
  if (!rawString || typeof rawString !== 'string') {
    return { name: '', address: '', domain: '', raw: '' };
  }

  const raw = rawString.trim();
  let name = '';
  let address;

  // Case 1: Angle bracket format: "Display Name" <user@domain.com>
  const angleMatch = raw.match(/^(?:["']?([^"<>]*)["']?\s*)?<([^\s<>@]+@[^\s<>@]+)>/);
  if (angleMatch) {
    name = (angleMatch[1] || '').trim();
    address = (angleMatch[2] || '').trim().toLowerCase();
  } else {
    // Case 2: Direct email string: user@domain.com
    const plainMatch = raw.match(/([^\s<>@]+@[^\s<>@]+)/);
    if (plainMatch) {
      address = plainMatch[1].trim().toLowerCase();
      name = raw.replace(plainMatch[0], '').replace(/["'<>()]/g, '').trim();
    } else {
      address = raw.toLowerCase();
    }
  }

  // Extract domain part after the @ symbol
  let domain = '';
  if (address && address.includes('@')) {
    domain = address.split('@')[1].trim().toLowerCase();
  }

  return { name, address, domain, raw };
}

/**
 * Extract IPv4 and IPv6 addresses from a header text string
 */
export function extractIpAddresses(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const ips = [];

  // Match standard 4-octet IPv4 addresses (e.g., 185.220.101.42)
  const ipv4Regex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  let match;
  while ((match = ipv4Regex.exec(text)) !== null) {
    const ip = match[0];
    if (!ips.includes(ip)) {
      ips.push(ip);
    }
  }

  // Match bracketed IPv6 addresses (e.g., [2001:db8::1])
  const ipv6Regex = /\[(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}\]/g;
  while ((match = ipv6Regex.exec(text)) !== null) {
    const ip = match[0].replace(/[[\]]/g, '');
    if (!ips.includes(ip)) {
      ips.push(ip);
    }
  }

  return ips;
}

/**
 * Parse a single RFC 5322 Received header into structured hop metadata
 * Standard syntax: from <sender> by <receiver> with <protocol> id <id> for <recipient>; <timestamp>
 */
export function parseReceivedHeader(rawReceived, index) {
  const hop = {
    hopNumber: index + 1,
    raw: rawReceived.trim(),
    from: '',
    fromHost: '',
    by: '',
    byHost: '',
    with: '',
    withProtocol: '',
    id: '',
    for: '',
    forRecipient: '',
    timestamp: '',
    date: null,
    formattedDate: '',
    ips: extractIpAddresses(rawReceived),
    tls: '',
    delaySeconds: null,
    delayFromPreviousSec: null,
    isOriginHop: false,
    isFinalHop: false
  };

  // The semicolon ';' separates the server routing tokens from the timestamp
  const semiIndex = rawReceived.lastIndexOf(';');
  let routingPart = rawReceived;

  if (semiIndex !== -1) {
    routingPart = rawReceived.slice(0, semiIndex).trim();
    const timePart = rawReceived.slice(semiIndex + 1).trim();
    hop.timestamp = timePart;

    const parsedDate = Date.parse(timePart);
    if (!isNaN(parsedDate)) {
      hop.date = new Date(parsedDate);
      hop.formattedDate = hop.date.toUTCString();
    } else {
      hop.formattedDate = timePart;
    }
  }

  // 1. Extract 'from' host token: "from <host>"
  const fromMatch = routingPart.match(/\bfrom\s+([^\s]+(?:\s+\([^)]+\))?)/i);
  if (fromMatch) {
    hop.from = fromMatch[1].trim();
    hop.fromHost = hop.from;
  }

  // 2. Extract 'by' host token: "by <host>"
  const byMatch = routingPart.match(/\bby\s+([^\s]+(?:\s+\([^)]+\))?)/i);
  if (byMatch) {
    hop.by = byMatch[1].trim();
    hop.byHost = hop.by;
  }

  // 3. Extract 'with' protocol token (e.g. ESMTP, ESMTPS, SMTP, HTTP)
  const withMatch = routingPart.match(/\bwith\s+([a-zA-Z0-9_-]+)/i);
  if (withMatch) {
    hop.with = withMatch[1].trim();
    hop.withProtocol = hop.with;
  }

  // 4. Extract TLS encryption cipher if recorded
  const tlsMatch = routingPart.match(/(TLS[v0-9._]+|using\s+TLS[^\s;]+)/i);
  if (tlsMatch) {
    hop.tls = tlsMatch[0].trim();
  }

  // 5. Extract 'for' recipient: "for <user@domain.com>"
  const forMatch = routingPart.match(/\bfor\s+<([^>]+)>/i);
  if (forMatch) {
    hop.for = forMatch[1].trim();
    hop.forRecipient = hop.for;
  }

  // 6. Extract MTA message queue ID
  const idMatch = routingPart.match(/\bid\s+([^\s;]+)/i);
  if (idMatch) {
    hop.id = idMatch[1].trim();
  }

  return hop;
}

/**
 * Parse an Authentication-Results header (RFC 7601 / RFC 8601)
 * Records receiving mail server verdicts for SPF, DKIM, and DMARC
 */
export function parseAuthenticationResults(authHeader) {
  const result = {
    authServId: '',
    raw: authHeader || '',
    spf: { status: 'NONE', details: '', domain: '', ip: '' },
    dkim: { status: 'NONE', details: '', domain: '', selector: '' },
    dmarc: { status: 'NONE', details: '', policy: '', domain: '' }
  };

  if (!authHeader) {
    return result;
  }

  // Service identifier is the receiving server name before the first semicolon
  const firstSemi = authHeader.indexOf(';');
  if (firstSemi !== -1) {
    result.authServId = authHeader.slice(0, firstSemi).trim();
  } else {
    result.authServId = authHeader.split(/\s+/)[0];
  }

  // Parse SPF status and domain
  const spfMatch = authHeader.match(/\bspf=([a-zA-Z]+)(?:\s*\(([^)]*)\))?/i);
  if (spfMatch) {
    result.spf.status = spfMatch[1].toUpperCase();
    result.spf.details = (spfMatch[2] || '').trim();

    const spfDomainMatch = authHeader.match(/(?:smtp\.mailfrom|domain\s+of)\s*=?\s*<?([^\s>;()]+)>?/i);
    if (spfDomainMatch) {
      const emailOrDomain = spfDomainMatch[1].toLowerCase();
      result.spf.domain = emailOrDomain.includes('@') ? emailOrDomain.split('@')[1] : emailOrDomain;
    }
  }

  // Parse DKIM status and signing domain
  const dkimMatch = authHeader.match(/\bdkim=([a-zA-Z]+)(?:\s*\(([^)]*)\))?/i);
  if (dkimMatch) {
    result.dkim.status = dkimMatch[1].toUpperCase();
    result.dkim.details = (dkimMatch[2] || '').trim();

    const dkimDomainMatch = authHeader.match(/header\.(?:i|d)\s*=\s*@?([^\s;()]+)/i);
    if (dkimDomainMatch) {
      result.dkim.domain = dkimDomainMatch[1].toLowerCase();
    }
  }

  // Parse DMARC policy decision and evaluation domain
  const dmarcMatch = authHeader.match(/\bdmarc=([a-zA-Z]+)(?:\s*\(([^)]*)\))?/i);
  if (dmarcMatch) {
    result.dmarc.status = dmarcMatch[1].toUpperCase();
    result.dmarc.details = (dmarcMatch[2] || '').trim();

    const policyMatch = authHeader.match(/\bp=([a-zA-Z]+)/i);
    if (policyMatch) {
      result.dmarc.policy = policyMatch[1].toLowerCase();
    }
    const dmarcDomainMatch = authHeader.match(/header\.from\s*=\s*@?([^\s;()]+)/i);
    if (dmarcDomainMatch) {
      result.dmarc.domain = dmarcDomainMatch[1].toLowerCase();
    }
  }

  return result;
}

/**
 * Parse DKIM-Signature header tags (RFC 6376)
 * Format: v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com; s=s2026; ...
 */
export function parseDkimSignature(dkimHeader) {
  if (!dkimHeader) return null;
  const tags = {};

  const parts = dkimHeader.split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx !== -1) {
      const key = part.slice(0, eqIdx).trim().toLowerCase();
      const val = part.slice(eqIdx + 1).trim();
      tags[key] = val;
    }
  }

  return {
    raw: dkimHeader,
    domain: tags['d'] || '',
    selector: tags['s'] || '',
    algorithm: tags['a'] || '',
    canonicalization: tags['c'] || '',
    headersSigned: tags['h'] || '',
    hasSignature: Boolean(tags['b'])
  };
}

/**
 * Extract all web URLs from text safely without executing them
 */
export function extractUrlsFromContent(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const urlRegex = /\b(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`[\]()]+/gi;
  const urls = [];
  const seen = new Set();

  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    let cleanUrl = match[0].replace(/[.,;:!?)]+$/, '');
    if (cleanUrl.startsWith('www.')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    if (!seen.has(cleanUrl)) {
      seen.add(cleanUrl);

      let domain;
      const isHttpOnly = cleanUrl.startsWith('http://');
      try {
        const parsed = new URL(cleanUrl);
        domain = parsed.hostname.toLowerCase();
      } catch {
        domain = cleanUrl.split('/')[2] || cleanUrl;
      }

      urls.push({
        url: cleanUrl,
        domain,
        isHttpOnly,
        isIpAddress: /^(\d{1,3}\.){3}\d{1,3}$/.test(domain)
      });
    }
  }

  return urls;
}

/**
 * Main Raw Email & Header Parser
 * Splits headers from body, unfolds RFC 5322 continuation lines,
 * and constructs an evidence-backed model for forensic analysis.
 */
export function parseRawEmail(rawInput) {
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      isValid: false,
      error: 'Input is empty. Please paste raw email headers or a complete email message.'
    };
  }

  // Step 1: Normalize Windows/Unix line endings to standard \n
  const normalized = rawInput.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Step 2: Separate header block from message body at first double newline (\n\n)
  let headerBlock = normalized;
  let bodyBlock = '';

  const doubleNewlineIndex = normalized.search(/\n\n/);
  if (doubleNewlineIndex !== -1) {
    const potentialHeaders = normalized.slice(0, doubleNewlineIndex);
    // Verify that the portion before \n\n has standard header pattern "Key: Value"
    if (/^[A-Za-z0-9_-]+:\s/m.test(potentialHeaders)) {
      headerBlock = potentialHeaders;
      bodyBlock = normalized.slice(doubleNewlineIndex + 2);
    }
  }

  // Step 3: Unfold continuation lines (RFC 5322 Section 2.2.3: "\n " or "\n\t")
  const unfoldedHeaders = headerBlock.replace(/\n[ \t]+/g, ' ');

  // Step 4: Split into individual header lines and populate the map
  const lines = unfoldedHeaders.split('\n');
  const headersMap = {};
  const allHeadersList = [];
  const receivedHeaders = [];
  const dkimSignatures = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      const fieldName = trimmed.slice(0, colonIdx).trim();
      const fieldValue = trimmed.slice(colonIdx + 1).trim();
      const lowerKey = fieldName.toLowerCase();

      allHeadersList.push({ name: fieldName, value: fieldValue, key: lowerKey });

      if (!headersMap[lowerKey]) {
        headersMap[lowerKey] = fieldValue;
      }

      // Collect multiple occurrences of specific headers
      if (lowerKey === 'received') {
        receivedHeaders.push(fieldValue);
      } else if (lowerKey === 'dkim-signature') {
        dkimSignatures.push(fieldValue);
      }
    }
  }

  // Step 5: Check that at least one recognizable email header exists
  const essentialFields = ['from', 'received', 'subject', 'to', 'date', 'message-id', 'authentication-results', 'return-path'];
  const recognizedCount = essentialFields.filter(field => Boolean(headersMap[field])).length;

  if (recognizedCount === 0 && allHeadersList.length < 2) {
    return {
      isValid: false,
      error: 'Malformed header data. No recognizable RFC 5322 email headers (e.g. From:, Received:, Subject:) were found.'
    };
  }

  // Step 6: Extract core envelope metadata
  const from = parseEmailAddress(headersMap['from']);
  const to = parseEmailAddress(headersMap['to']);
  const replyTo = parseEmailAddress(headersMap['reply-to']);
  const returnPath = parseEmailAddress(headersMap['return-path']);

  const subject = headersMap['subject'] || '(No Subject)';
  const dateRaw = headersMap['date'] || '';
  const messageId = headersMap['message-id'] || '';

  // Step 7: Parse Received headers chronologically
  // In RFC 5322, each relaying server prepends its Received: line to the top.
  // Reversing the array places Hop #1 at origin and Hop #N at the recipient gateway.
  const chronologicalHops = receivedHeaders.slice().reverse().map((rawRec, idx) => {
    const hop = parseReceivedHeader(rawRec, idx);
    hop.isOriginHop = idx === 0;
    hop.isFinalHop = idx === receivedHeaders.length - 1;
    return hop;
  });

  // Calculate transit delay between successive hops
  for (let i = 1; i < chronologicalHops.length; i++) {
    const prevHop = chronologicalHops[i - 1];
    const currHop = chronologicalHops[i];
    if (prevHop.date && currHop.date) {
      const diffMs = currHop.date.getTime() - prevHop.date.getTime();
      const diffSec = Math.round(diffMs / 1000);
      currHop.delaySeconds = diffSec;
      currHop.delayFromPreviousSec = diffSec;
    }
  }

  // Step 8: Parse Authentication Results (SPF, DKIM, DMARC)
  const authResultsRaw = headersMap['authentication-results'] || '';
  const authResults = parseAuthenticationResults(authResultsRaw);

  // If Received-SPF is present and auth-results did not have SPF, supplement it
  if (headersMap['received-spf'] && authResults.spf.status === 'NONE') {
    const spfMatch = headersMap['received-spf'].match(/\b(pass|fail|softfail|neutral|none)\b/i);
    if (spfMatch) {
      authResults.spf.status = spfMatch[1].toUpperCase();
      authResults.spf.details = headersMap['received-spf'];
    }
  }

  const parsedDkimSignatures = dkimSignatures.map(parseDkimSignature).filter(Boolean);

  // Step 9: Extract URLs from headers and body
  const headerUrls = extractUrlsFromContent(unfoldedHeaders);
  const bodyUrls = extractUrlsFromContent(bodyBlock);
  const allUrlsMap = new Map();
  [...headerUrls, ...bodyUrls].forEach(item => allUrlsMap.set(item.url, item));
  const extractedUrls = Array.from(allUrlsMap.values());

  return {
    isValid: true,
    hasBody: Boolean(bodyBlock.trim()),
    bodySnippet: bodyBlock ? bodyBlock.slice(0, 500) : '',
    headersCount: allHeadersList.length,
    rawHeaders: headerBlock,
    headers: headersMap,
    from,
    to,
    replyTo: replyTo.address ? replyTo : null,
    returnPath: returnPath.address ? returnPath : null,
    subject,
    dateRaw,
    messageId,
    receivedHops: chronologicalHops,
    receivedHopsCount: chronologicalHops.length,
    rawReceivedCount: receivedHeaders.length,
    authResults,
    dkimSignatures: parsedDkimSignatures,
    extractedUrls,
    allHeadersList,
    rawHeadersMap: headersMap
  };
}

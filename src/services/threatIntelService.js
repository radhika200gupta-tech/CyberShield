/**
 * Threat Intelligence Service
 * Handles data fetching, multi-source feed parsing (URLhaus & TweetFeed Community Telemetry),
 * normalization, heuristic classification, deduplication, and safe CSV export.
 */

// Known high-impact malware families, ransomware, and botnets
const HIGH_IMPACT_MALWARE = [
  'emotet', 'qakbot', 'qbot', 'cobalt', 'ransomware', 'lockbit',
  'asyncrat', 'agenttesla', 'redline', 'lumma', 'mirai', 'mozi',
  'icedid', 'dridex', 'remcos', 'formbook', 'stealer', 'trickbot',
  'njrat', 'guploader', 'amadey', 'smokeloader', 'xworm', 'guloader',
  'valleyrat', 'netsupport', 'spynote', 'vidar', 'c2', 'rat', 'trojan',
  'apt', 'botnet', 'malvertising', 'infostealer'
];

// Dangerous executable and script file extensions
const EXECUTABLE_EXTENSIONS = [
  '.exe', '.sh', '.bin', '.elf', '.dll', '.bat', '.ps1',
  '.apk', '.vbs', '.hta', '.msi', '.scr', '.jar', '.com'
];

// Direct fallback public threat intelligence URL (with Access-Control-Allow-Origin: *)
export const PUBLIC_TWEETFEED_FALLBACK_URL = 'https://raw.githubusercontent.com/0xDanielLopez/TweetFeed/master/week.csv';

/**
 * Transparent heuristic severity classification.
 * Assessed internally based on:
 * - Online status (reachable host actively serving payloads)
 * - File extension (direct executable / dropper script)
 * - Known high-impact malware family tags
 * - Phishing indicators
 *
 * @param {Object} raw
 * @returns {{ severity: 'Critical' | 'High' | 'Medium' | 'Low', rationale: string }}
 */
export function calculateSeverity(raw) {
  const isOnline = String(raw.url_status || 'online').toLowerCase() === 'online';
  const indicatorLower = String(raw.url || raw.indicator || '').toLowerCase();
  const tagsLower = Array.isArray(raw.tags)
    ? raw.tags.map(t => String(t).toLowerCase().replace(/^#/, ''))
    : [];

  let hasExecDrop = false;
  let detectedExt = '';
  try {
    const urlToParse = indicatorLower.startsWith('http://') || indicatorLower.startsWith('https://')
      ? indicatorLower
      : `http://${indicatorLower}`;
    const parsed = new URL(urlToParse);
    const pathname = parsed.pathname.toLowerCase();
    for (const ext of EXECUTABLE_EXTENSIONS) {
      if (pathname.endsWith(ext) || pathname.includes(ext + '?')) {
        hasExecDrop = true;
        detectedExt = ext;
        break;
      }
    }
  } catch {
    for (const ext of EXECUTABLE_EXTENSIONS) {
      if (indicatorLower.includes(ext)) {
        hasExecDrop = true;
        detectedExt = ext;
        break;
      }
    }
  }

  const matchedFamily = highImpactMalwareMatch(tagsLower);
  const isPhishing = tagsLower.some(t => t.includes('phish'));
  const isRansomware = tagsLower.some(t => t.includes('ransom'));
  const isC2 = tagsLower.some(t => t.includes('c2') || t.includes('c&c'));

  if (isOnline && (hasExecDrop || matchedFamily || isRansomware || isC2)) {
    const reasons = [];
    if (isOnline) reasons.push('Host active online');
    if (hasExecDrop) reasons.push(`Direct executable payload (${detectedExt})`);
    if (matchedFamily) reasons.push(`High-impact malware family (${matchedFamily})`);
    if (isRansomware) reasons.push('Active ransomware campaign');
    if (isC2) reasons.push('Command & Control node');
    return {
      severity: 'Critical',
      rationale: `Critical threat: ${reasons.join('; ')}.`
    };
  }

  if (hasExecDrop || isRansomware || matchedFamily) {
    const reasons = [];
    if (hasExecDrop) reasons.push(`Executable dropper signature (${detectedExt})`);
    if (matchedFamily) reasons.push(`Malware family signature (${matchedFamily})`);
    if (isRansomware) reasons.push('Ransomware infrastructure');
    return {
      severity: 'High',
      rationale: `High threat (heuristics): ${reasons.join('; ')}.`
    };
  }

  if (isPhishing) {
    return {
      severity: isOnline ? 'High' : 'Medium',
      rationale: isOnline
        ? 'High threat: Active phishing credential harvesting campaign reported by community telemetry.'
        : 'Medium threat: Reported phishing domain/URL (currently inactive or reported).'
    };
  }

  if (isOnline) {
    return {
      severity: 'High',
      rationale: 'High threat: Active online host reported distributing malicious content.'
    };
  }

  if (tagsLower.length > 0) {
    return {
      severity: 'Medium',
      rationale: `Medium threat: Offline indicator associated with tags: ${tagsLower.join(', ')}.`
    };
  }

  return {
    severity: 'Low',
    rationale: 'Low threat: Inactive / unclassified reported indicator.'
  };
}

function highImpactMalwareMatch(tagsLower) {
  for (const tag of tagsLower) {
    for (const malware of HIGH_IMPACT_MALWARE) {
      if (tag.includes(malware)) return malware.toUpperCase();
    }
  }
  return null;
}

/**
 * Extracts network and payload evidence from a given URL or host string.
 * @param {string} urlStr
 * @returns {Object}
 */
export function extractUrlEvidence(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    return {
      host: 'Unknown',
      port: '80',
      protocol: 'http',
      pathname: '/',
      fileExtension: null,
      isIpAddress: false
    };
  }

  const trimmed = urlStr.trim();
  const hasScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://');
  const targetToParse = hasScheme ? trimmed : `http://${trimmed}`;

  try {
    const parsed = new URL(targetToParse);
    const pathname = parsed.pathname;
    const extMatch = pathname.match(/\.([a-zA-Z0-9]{2,5})(?:[?#]|$)/);
    const fileExtension = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname);

    return {
      host: parsed.hostname || trimmed,
      port: parsed.port || (hasScheme && parsed.protocol === 'https:' ? '443' : '80'),
      protocol: hasScheme ? parsed.protocol.replace(':', '') : 'http',
      pathname: pathname || '/',
      fileExtension: fileExtension || null,
      isIpAddress
    };
  } catch {
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed);
    return {
      host: trimmed,
      port: '80',
      protocol: 'http',
      pathname: '/',
      fileExtension: null,
      isIpAddress
    };
  }
}

/**
 * Detects HTML application shell responses (e.g. SPA fallback index.html).
 * @param {string} text
 * @returns {boolean}
 */
export function isHtmlResponse(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim().toLowerCase();
  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<div id="root">') ||
    trimmed.includes('<script type="module"') ||
    trimmed.includes('<title>410 gone</title>') ||
    trimmed.includes('<title>404 not found</title>')
  );
}

/**
 * Parses threat feed CSV data into raw records.
 * Supports:
 * 1. abuse.ch URLhaus CSV format (9 columns, #-prefixed metadata header)
 * 2. TweetFeed security telemetry format (date, reporter, type, indicator, tags, report_url)
 * 3. Plain URL list
 *
 * @param {string} csvText
 * @param {string} [hintSource]
 * @returns {{ providerLastUpdated: string | null, records: Array<Object>, isHtmlFallback: boolean, isRecognizedFormat: boolean, detectedSource: string }}
 */
export function parseThreatFeedCsv(csvText, hintSource = '') {
  if (!csvText || typeof csvText !== 'string') {
    return {
      providerLastUpdated: null,
      records: [],
      isHtmlFallback: false,
      isRecognizedFormat: false,
      detectedSource: 'Unknown'
    };
  }

  if (isHtmlResponse(csvText)) {
    return {
      providerLastUpdated: null,
      records: [],
      isHtmlFallback: true,
      isRecognizedFormat: false,
      detectedSource: 'HTML Fallback'
    };
  }

  const lines = csvText.split(/\r?\n/);
  let providerLastUpdated = null;
  let hasUrlhausHeader = false;
  let isTweetFeedFormat = false;
  const rawRecords = [];

  // Check header lines for format identification
  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().includes('urlhaus')) {
      hasUrlhausHeader = true;
    }
    if (line.includes('Last updated:')) {
      const match = line.match(/Last updated:\s*([^(]+(?:\(UTC\))?)/i);
      if (match) providerLastUpdated = match[1].trim();
    }
  }

  // Parse records
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Skip metadata / comment lines
    if (rawLine.startsWith('#') || rawLine.startsWith('!')) {
      if (rawLine.includes('Last updated:') && !providerLastUpdated) {
        const match = rawLine.match(/Last updated:\s*([^(]+(?:\(UTC\))?)/i);
        if (match) providerLastUpdated = match[1].trim();
      }
      continue;
    }

    // 1. Check for URLhaus schema if header was present or line has 8+ comma-separated fields with quotes
    if (hasUrlhausHeader) {
      const cells = parseCsvLine(rawLine);
      if (cells.length >= 8) {
        // Standard URLhaus CSV schema:
        // 0: id, 1: dateadded, 2: url, 3: url_status, 4: last_online, 5: threat, 6: tags, 7: urlhaus_link, 8: reporter
        rawRecords.push({
          id: cells[0] || `uh-${i}`,
          dateadded: cells[1] || '',
          url: cells[2] || '',
          url_status: cells[3] || 'online',
          last_online: cells[4] || '',
          threat: cells[5] || 'malware_download',
          tags: cells[6] ? cells[6].split(',').map(t => t.trim()).filter(Boolean) : [],
          urlhaus_link: cells[7] || (cells[0] ? `https://urlhaus.abuse.ch/url/${cells[0]}/` : ''),
          reporter: cells[8] || 'abuse.ch Community',
          source: 'abuse.ch URLhaus',
          type: 'url'
        });
        continue;
      }
    }

    // 2. Check for TweetFeed format: date,reporter,type,indicator,tags,url
    // Example: 2026-10-27 13:19:39,nextronresearch,sha256,a75ff95...,#PHP2Shell,https://x.com/...
    const p1 = rawLine.indexOf(',');
    const p2 = rawLine.indexOf(',', p1 + 1);
    const p3 = rawLine.indexOf(',', p2 + 1);
    const pLast = rawLine.lastIndexOf(',');
    const pSecondLast = rawLine.lastIndexOf(',', pLast - 1);

    if (p1 > 8 && p2 > p1 && p3 > p2 && pLast > pSecondLast && pSecondLast > p3) {
      const date = rawLine.slice(0, p1).trim();
      const reporter = rawLine.slice(p1 + 1, p2).trim();
      const type = rawLine.slice(p2 + 1, p3).trim().toLowerCase();
      const indicator = rawLine.slice(p3 + 1, pSecondLast).trim();
      const rawTags = rawLine.slice(pSecondLast + 1, pLast).trim();
      const reportUrl = rawLine.slice(pLast + 1).trim();

      // Validate date looks like YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
        isTweetFeedFormat = true;
        const tags = rawTags
          .split(/[\s,]+/)
          .map(t => t.replace(/^#/, '').trim())
          .filter(Boolean);

        rawRecords.push({
          id: `tf-${i + 1}`,
          dateadded: date,
          url: indicator,
          url_status: 'online',
          last_online: date,
          threat: tags[0] || type,
          tags,
          urlhaus_link: reportUrl,
          reporter: reporter || 'Infosec Researcher',
          source: 'TweetFeed Security Telemetry (Live Community Feed)',
          type
        });
        continue;
      }
    }

    // 3. Fallback: URLhaus line without header
    const cells = parseCsvLine(rawLine);
    if (cells.length >= 8 && cells[2] && (cells[2].startsWith('http://') || cells[2].startsWith('https://'))) {
      rawRecords.push({
        id: cells[0] || `uh-${i}`,
        dateadded: cells[1] || '',
        url: cells[2] || '',
        url_status: cells[3] || 'online',
        last_online: cells[4] || '',
        threat: cells[5] || 'malware_download',
        tags: cells[6] ? cells[6].split(',').map(t => t.trim()).filter(Boolean) : [],
        urlhaus_link: cells[7] || '',
        reporter: cells[8] || 'Community Reporter',
        source: 'abuse.ch URLhaus',
        type: 'url'
      });
      continue;
    }

    // 4. Fallback: Plain URL list
    if (rawLine.startsWith('http://') || rawLine.startsWith('https://')) {
      rawRecords.push({
        id: `url-${i + 1}`,
        dateadded: new Date().toISOString().slice(0, 19).replace('T', ' '),
        url: rawLine,
        url_status: 'online',
        last_online: new Date().toISOString().slice(0, 19).replace('T', ' '),
        threat: 'malicious_url',
        tags: ['phishing'],
        urlhaus_link: '',
        reporter: 'Open Threat Feed',
        source: 'Open Threat Telemetry',
        type: 'url'
      });
    }
  }

  const detectedSource = hasUrlhausHeader
    ? 'abuse.ch URLhaus'
    : (isTweetFeedFormat ? 'TweetFeed Security Telemetry (Live Community Feed)' : (hintSource || 'Community Threat Feed'));

  return {
    providerLastUpdated,
    records: rawRecords,
    isHtmlFallback: false,
    isRecognizedFormat: rawRecords.length > 0,
    detectedSource
  };
}

/**
 * Standard CSV line parser with quote escaping support.
 * @param {string} rawLine
 * @returns {Array<string>}
 */
function parseCsvLine(rawLine) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let c = 0; c < rawLine.length; c++) {
    const ch = rawLine[c];
    if (ch === '"') {
      if (inQuotes && rawLine[c + 1] === '"') {
        current += '"';
        c++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

/**
 * Normalizes raw threat records into CyberShield's standard internal threat model.
 * Consistent 14-field schema.
 *
 * @param {Array<Object>} rawRecords
 * @param {string} [fetchTimestamp]
 * @param {string} [defaultSource]
 * @returns {Array<Object>}
 */
export function normalizeThreatRecords(
  rawRecords,
  fetchTimestamp = new Date().toISOString(),
  defaultSource = 'Threat Intelligence Feed'
) {
  if (!Array.isArray(rawRecords)) return [];

  return rawRecords.map((raw, idx) => {
    const { severity, rationale } = calculateSeverity(raw);
    const indicator = String(raw.url || raw.indicator || '').trim();
    const evidence = extractUrlEvidence(indicator);

    // Format human-friendly threat category
    let category = 'Malicious Indicator';
    const tagsLower = (raw.tags || []).map(t => String(t).toLowerCase());

    if (tagsLower.some(t => t.includes('phish'))) {
      category = 'Phishing Campaign';
    } else if (tagsLower.some(t => t.includes('ransom'))) {
      category = 'Ransomware Distribution';
    } else if (tagsLower.some(t => t.includes('c2') || t.includes('c&c'))) {
      category = 'Command & Control (C2)';
    } else if (tagsLower.some(t => t.includes('stealer'))) {
      category = 'Credential Stealer';
    } else if (tagsLower.some(t => t.includes('rat'))) {
      category = 'Remote Access Trojan (RAT)';
    } else if (tagsLower.some(t => t.includes('trojan'))) {
      category = 'Trojan Horse';
    } else if (tagsLower.some(t => t.includes('botnet'))) {
      category = 'Botnet Node';
    } else if (raw.threat === 'malware_download' || tagsLower.some(t => t.includes('malware'))) {
      category = 'Malware Distribution';
    } else if (raw.threat && raw.threat !== 'malicious_url') {
      category = String(raw.threat).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else if (tagsLower.length > 0) {
      category = tagsLower[0].charAt(0).toUpperCase() + tagsLower[0].slice(1) + ' Indicator';
    }

    // Determine normalized indicator type
    let indicatorType = 'URL';
    const rawType = String(raw.type || '').toLowerCase();
    if (rawType === 'domain' || (!indicator.startsWith('http://') && !indicator.startsWith('https://') && !evidence.isIpAddress && indicator.includes('.'))) {
      indicatorType = 'Domain';
    } else if (rawType === 'ip' || evidence.isIpAddress) {
      indicatorType = 'IP';
    } else if (rawType === 'sha256' || rawType === 'md5' || /^[a-f0-9]{32,64}$/i.test(indicator)) {
      indicatorType = 'FileHash';
    }

    const firstSeen = raw.dateadded || raw.firstSeen || fetchTimestamp;
    const lastSeen = raw.last_online || raw.lastSeen || firstSeen;

    return {
      id: String(raw.id || `threat-${idx + 1}`),
      indicator,
      indicatorType,
      category,
      severity,
      severitySource: 'internally_assessed',
      severityRationale: rationale,
      source: raw.source || defaultSource,
      firstSeen,
      lastSeen,
      reportUrl: raw.urlhaus_link || raw.reportUrl || '',
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      evidence: {
        ...evidence,
        urlStatus: raw.url_status || 'online',
        reporter: raw.reporter || 'Security Researcher'
      },
      latitude: null,
      longitude: null,
      lastFetchedAt: fetchTimestamp
    };
  });
}

/**
 * Calculates unique indicators count (deduplicating normalized URLs/domains).
 * @param {Array<Object>} items
 * @returns {number}
 */
export function calculateUniqueIndicators(items) {
  if (!items || !items.length) return 0;
  const uniqueSet = new Set(
    items.map(item => (item.indicator || '').trim().toLowerCase())
  );
  return uniqueSet.size;
}

/**
 * Fetches recent threat indicators from configured backend proxy or public community feed.
 * 
 * 1. Queries local dev or serverless proxy (/api/urlhaus-feed)
 * 2. If proxy returns HTML SPA fallback or is unavailable, falls back directly
 *    to the live public TweetFeed telemetry endpoint (which provides Access-Control-Allow-Origin: *).
 *
 * @param {Object} options
 * @param {number} [options.byteLimit=65536]
 * @param {string} [options.endpoint='/api/urlhaus-feed']
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<Object>,
 *   providerLastUpdated: string | null,
 *   fetchedAt: string,
 *   sourceName: string,
 *   isProxy: boolean,
 *   isGenuinelyEmpty?: boolean,
 *   error?: string
 * }>}
 */
export async function fetchThreatIntelligenceFeed({ 
  byteLimit = 65536, 
  endpoint = '/api/urlhaus-feed',
  signal 
} = {}) {
  const fetchTimestamp = new Date().toISOString();
  let lastError = null;

  // 1. Try primary proxy endpoint
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Range': `bytes=0-${byteLimit}`
      },
      signal
    });

    if (response.ok || response.status === 206) {
      const contentType = response.headers.get('content-type') || '';
      const sourceHeader = response.headers.get('x-threat-source') || '';
      const csvText = await response.text();

      const { 
        providerLastUpdated, 
        records: rawRecords, 
        isHtmlFallback, 
        isRecognizedFormat,
        detectedSource 
      } = parseThreatFeedCsv(csvText, sourceHeader);

      if (!isHtmlFallback && !contentType.includes('text/html') && isRecognizedFormat && rawRecords.length > 0) {
        // Reverse so newest records appear first
        const sortedRecords = [...rawRecords].reverse();
        const normalizedData = normalizeThreatRecords(sortedRecords, fetchTimestamp, detectedSource);

        return {
          success: true,
          data: normalizedData,
          providerLastUpdated,
          fetchedAt: fetchTimestamp,
          sourceName: detectedSource,
          isProxy: true,
          isGenuinelyEmpty: false
        };
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    lastError = err;
    console.warn('Proxy threat feed query failed, attempting direct public feed fallback:', err.message);
  }

  // 2. Direct client fallback to live public community threat intelligence feed (TweetFeed)
  // This endpoint has native Access-Control-Allow-Origin: * and requires zero API keys.
  try {
    const fallbackResponse = await fetch(PUBLIC_TWEETFEED_FALLBACK_URL, {
      signal
    });

    if (fallbackResponse.ok) {
      const csvText = await fallbackResponse.text();
      const { 
        providerLastUpdated, 
        records: rawRecords, 
        isHtmlFallback, 
        isRecognizedFormat 
      } = parseThreatFeedCsv(csvText, 'TweetFeed Security Telemetry (Live Community Feed)');

      if (!isHtmlFallback && isRecognizedFormat && rawRecords.length > 0) {
        // Keep the latest 250 records and reverse so newest is on top
        const recentRecords = rawRecords.slice(-250).reverse();
        const sourceName = 'TweetFeed Security Telemetry (Live Community Feed)';
        const normalizedData = normalizeThreatRecords(recentRecords, fetchTimestamp, sourceName);

        return {
          success: true,
          data: normalizedData,
          providerLastUpdated,
          fetchedAt: fetchTimestamp,
          sourceName,
          isProxy: false,
          isGenuinelyEmpty: false
        };
      }
    }
  } catch (fallbackErr) {
    if (fallbackErr.name === 'AbortError') {
      throw fallbackErr;
    }
    lastError = fallbackErr;
  }

  let message = lastError?.message || 'Failed to connect to threat intelligence feed.';
  if (lastError?.name === 'TypeError' && message.toLowerCase().includes('failed to fetch')) {
    message = 'Network error connecting to threat intelligence provider. Please verify your internet connection.';
  }

  return {
    success: false,
    data: [],
    providerLastUpdated: null,
    fetchedAt: fetchTimestamp,
    sourceName: 'Threat Intelligence Telemetry',
    isProxy: false,
    error: message
  };
}

/**
 * Generates safe, sanitized CSV export text for the given dataset.
 * Neutralizes CSV/formula injection (=, +, -, @, \t, \r) and properly escapes double quotes.
 *
 * @param {Array<Object>} records
 * @returns {string | null}
 */
export function generateThreatCsv(records) {
  if (!records || records.length === 0) {
    return null;
  }

  const headers = [
    'Indicator ID',
    'Indicator',
    'Indicator Type',
    'Category',
    'Severity',
    'Severity Assessment Source',
    'Feed Source',
    'Status',
    'First Seen (UTC)',
    'Last Online (UTC)',
    'Reporter',
    'Threat Tags',
    'Target Host / IP',
    'Port',
    'File Extension',
    'Official Report Link',
    'Fetched At'
  ];

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    let str = String(val);

    // CSV Formula Injection Mitigation:
    // If cell begins with formula characters, prefix with single quote
    if (/^[\s]*[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }

    // Escape internal double quotes by doubling them
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map(r => [
    escapeCell(r.id),
    escapeCell(r.indicator),
    escapeCell(r.indicatorType),
    escapeCell(r.category),
    escapeCell(r.severity),
    escapeCell(r.severitySource),
    escapeCell(r.source),
    escapeCell(r.evidence?.urlStatus || 'online'),
    escapeCell(r.firstSeen),
    escapeCell(r.lastSeen),
    escapeCell(r.evidence?.reporter || ''),
    escapeCell((r.tags || []).join('; ')),
    escapeCell(r.evidence?.host || ''),
    escapeCell(r.evidence?.port || ''),
    escapeCell(r.evidence?.fileExtension || ''),
    escapeCell(r.reportUrl),
    escapeCell(r.lastFetchedAt)
  ].join(','));

  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
}

/**
 * Triggers a safe browser download of the generated CSV file.
 * @param {string} csvContent
 * @param {string} [filename]
 */
export function downloadCsvFile(csvContent, filename) {
  if (!csvContent) return;

  const dateStr = new Date().toISOString().slice(0, 10);
  const finalFilename = filename || `cybershield_threat_intel_${dateStr}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

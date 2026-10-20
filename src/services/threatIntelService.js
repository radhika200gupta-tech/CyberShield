/**
 * Threat Intelligence Service
 * Handles data fetching, normalization, heuristics, deduplication, and safe CSV export
 * for abuse.ch URLhaus threat feeds.
 */

// Known high-impact malware families and botnets frequently tracked by URLhaus
const HIGH_IMPACT_MALWARE = [
  'emotet', 'qakbot', 'qbot', 'cobalt', 'ransomware', 'lockbit',
  'asyncrat', 'agenttesla', 'redline', 'lumma', 'mirai', 'mozi',
  'icedid', 'dridex', 'remcos', 'formbook', 'stealer', 'trickbot',
  'njrat', 'guploader', 'amadey', 'smokeloader', 'xworm', 'guloader'
];

// Dangerous executable and script file extensions
const EXECUTABLE_EXTENSIONS = [
  '.exe', '.sh', '.bin', '.elf', '.dll', '.bat', '.ps1',
  '.apk', '.vbs', '.hta', '.msi', '.scr', '.jar', '.com'
];

/**
 * Transparent heuristic severity classification.
 * Severity is internally assessed based on:
 * - URL online status (reachable host actively serving payloads)
 * - File extension (direct executable / dropper script)
 * - Known high-impact malware family tags
 *
 * @param {Object} raw
 * @returns {{ severity: 'Critical' | 'High' | 'Medium' | 'Low', rationale: string }}
 */
export function calculateSeverity(raw) {
  const isOnline = String(raw.url_status || '').toLowerCase() === 'online';
  const urlLower = String(raw.url || '').toLowerCase();
  const tagsLower = Array.isArray(raw.tags)
    ? raw.tags.map(t => String(t).toLowerCase())
    : [];

  let hasExecDrop = false;
  let detectedExt = '';
  try {
    const parsed = new URL(raw.url);
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
      if (urlLower.includes(ext)) {
        hasExecDrop = true;
        detectedExt = ext;
        break;
      }
    }
  }

  const matchedFamily = highImpactMalwareMatch(tagsLower);

  if (isOnline && (hasExecDrop || matchedFamily)) {
    const reasons = [];
    if (isOnline) reasons.push('Host verified online');
    if (hasExecDrop) reasons.push(`Direct executable payload (${detectedExt})`);
    if (matchedFamily) reasons.push(`High-impact malware family (${matchedFamily})`);
    return {
      severity: 'Critical',
      rationale: `Critical threat: ${reasons.join('; ')}.`
    };
  }

  if (isOnline) {
    return {
      severity: 'High',
      rationale: 'High threat: Active online host reported distributing malicious content.'
    };
  }

  if (hasExecDrop || matchedFamily) {
    const reasons = [];
    if (hasExecDrop) reasons.push(`Executable dropper signature (${detectedExt})`);
    if (matchedFamily) reasons.push(`Malware family (${matchedFamily})`);
    return {
      severity: 'High',
      rationale: `High threat (currently offline): ${reasons.join('; ')}.`
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
 * Extracts network and payload evidence from a given URL string.
 * @param {string} urlStr
 * @returns {Object}
 */
export function extractUrlEvidence(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const pathname = parsed.pathname;
    const extMatch = pathname.match(/\.([a-zA-Z0-9]{2,5})(?:[?#]|$)/);
    const fileExtension = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname);

    return {
      host: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
      protocol: parsed.protocol.replace(':', ''),
      pathname: pathname || '/',
      fileExtension: fileExtension || null,
      isIpAddress
    };
  } catch {
    return {
      host: 'Unknown',
      port: '',
      protocol: 'http',
      pathname: '',
      fileExtension: null,
      isIpAddress: false
    };
  }
}

/**
 * Parse URLhaus CSV feed into raw records.
 * Supports standard CSV quotes, escaped quotes, and metadata comments.
 *
 * @param {string} csvText
 * @returns {{ providerLastUpdated: string | null, records: Array<Object> }}
 */
export function parseUrlhausCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return { providerLastUpdated: null, records: [], isHtmlFallback: false, isRecognizedFormat: false };
  }

  const trimmed = csvText.trim();

  // Detect HTML fallback responses (e.g. Vercel SPA routing returning index.html)
  if (
    trimmed.toLowerCase().startsWith('<!doctype html') ||
    trimmed.toLowerCase().startsWith('<html') ||
    trimmed.includes('<div id="root">') ||
    trimmed.includes('<script type="module"')
  ) {
    return {
      providerLastUpdated: null,
      records: [],
      isHtmlFallback: true,
      isRecognizedFormat: false
    };
  }

  const lines = csvText.split(/\r?\n/);
  let providerLastUpdated = null;
  let hasUrlhausHeader = false;
  const rawRecords = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    if (rawLine.startsWith('#')) {
      if (rawLine.toLowerCase().includes('urlhaus')) {
        hasUrlhausHeader = true;
      }
      if (rawLine.includes('Last updated:')) {
        const match = rawLine.match(/Last updated:\s*([^(]+(?:\(UTC\))?)/i);
        if (match) providerLastUpdated = match[1].trim();
      }
      continue;
    }

    // CSV line parser handling double-quoted fields
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

    // Filter out truncated lines if byte-range fetch cut off the last row
    if (cells.length < 8) continue;

    // Standard URLhaus CSV schema:
    // 0: id, 1: dateadded, 2: url, 3: url_status, 4: last_online, 5: threat, 6: tags, 7: urlhaus_link, 8: reporter
    rawRecords.push({
      id: cells[0] || `url-${i}`,
      dateadded: cells[1] || '',
      url: cells[2] || '',
      url_status: cells[3] || 'unknown',
      last_online: cells[4] || '',
      threat: cells[5] || 'malware_download',
      tags: cells[6] ? cells[6].split(',').map(t => t.trim()).filter(Boolean) : [],
      urlhaus_link: cells[7] || (cells[0] ? `https://urlhaus.abuse.ch/url/${cells[0]}/` : ''),
      reporter: cells[8] || 'Community Reporter'
    });
  }

  const isRecognizedFormat = hasUrlhausHeader || rawRecords.length > 0;

  return { 
    providerLastUpdated, 
    records: rawRecords, 
    isHtmlFallback: false, 
    isRecognizedFormat 
  };
}

/**
 * Normalizes raw URLhaus records into CyberShield internal threat model.
 * Consistent 14-field schema ready for Phase 2 integration.
 *
 * @param {Array<Object>} rawRecords
 * @param {string} fetchTimestamp
 * @returns {Array<Object>}
 */
export function normalizeThreatRecords(rawRecords, fetchTimestamp = new Date().toISOString()) {
  return rawRecords.map((raw) => {
    const { severity, rationale } = calculateSeverity(raw);
    const evidence = extractUrlEvidence(raw.url);

    // Format human-friendly threat category
    let category = 'Malware Download';
    if (raw.threat === 'malware_download') {
      category = 'Malware Distribution';
    } else if (raw.threat) {
      category = raw.threat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return {
      id: String(raw.id),
      indicator: raw.url,
      indicatorType: 'URL',
      category,
      severity,
      severitySource: 'internally_assessed',
      severityRationale: rationale,
      source: 'abuse.ch URLhaus',
      firstSeen: raw.dateadded,
      lastSeen: raw.last_online || raw.dateadded,
      reportUrl: raw.urlhaus_link,
      tags: raw.tags || [],
      evidence: {
        ...evidence,
        urlStatus: raw.url_status,
        reporter: raw.reporter
      },
      latitude: null, // Nullable for Phase 1; populated in Phase 2 with GeoIP
      longitude: null, // Nullable for Phase 1; populated in Phase 2 with GeoIP
      lastFetchedAt: fetchTimestamp
    };
  });
}

/**
 * Calculates unique indicators count (deduplicating normalized URLs).
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
 * Fetches recent threat indicators from abuse.ch URLhaus.
 * Uses Vite dev server proxy `/api/urlhaus-feed/downloads/csv_recent/` with byte-range header.
 *
 * @param {Object} options
 * @param {number} [options.byteLimit=65536] - Default 64KB (~200-300 records)
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<Object>,
 *   providerLastUpdated: string | null,
 *   fetchedAt: string,
 *   sourceName: string,
 *   isProxy: boolean,
 *   error?: string
 * }>}
 */
export async function fetchThreatIntelligenceFeed({ 
  byteLimit = 65536, 
  endpoint = '/api/urlhaus-feed',
  signal 
} = {}) {
  const fetchTimestamp = new Date().toISOString();

  // Try primary endpoint, with automatic subpath fallback if initial attempt returns HTML
  const endpointsToTry = [endpoint];
  if (endpoint === '/api/urlhaus-feed') {
    endpointsToTry.push('/api/urlhaus-feed/downloads/csv_recent/');
  }

  let lastError = null;

  for (const currentEndpoint of endpointsToTry) {
    try {
      const response = await fetch(currentEndpoint, {
        headers: {
          'Range': `bytes=0-${byteLimit}`
        },
        signal
      });

      if (!response.ok && response.status !== 206) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Feed provider rejected request (HTTP ${response.status} Unauthorized / Forbidden). Check API credentials if required.`);
        }
        if (response.status === 429) {
          throw new Error('Feed provider rate limit reached (HTTP 429). Please wait before retrying.');
        }
        throw new Error(`Feed request returned HTTP status ${response.status} (${response.statusText || 'Error'})`);
      }

      const contentType = response.headers.get('content-type') || '';
      const csvText = await response.text();

      const { 
        providerLastUpdated, 
        records: rawRecords, 
        isHtmlFallback, 
        isRecognizedFormat 
      } = parseUrlhausCsv(csvText);

      if (isHtmlFallback || contentType.includes('text/html')) {
        lastError = new Error(
          'Received HTML application shell instead of threat feed. ' +
          'Ensure the reverse proxy rewrite or API handler for "/api/urlhaus-feed" is active in server configuration (vercel.json / api/urlhaus-feed.js).'
        );
        continue;
      }

      if (!isRecognizedFormat && rawRecords.length === 0) {
        throw new Error('Received empty or unrecognized response from threat feed provider.');
      }

      // Genuinely empty feed from provider
      if (rawRecords.length === 0) {
        return {
          success: true,
          data: [],
          providerLastUpdated,
          fetchedAt: fetchTimestamp,
          sourceName: 'abuse.ch URLhaus (Recent Feeds)',
          isProxy: true,
          isGenuinelyEmpty: true
        };
      }

      const normalizedData = normalizeThreatRecords(rawRecords, fetchTimestamp);

      return {
        success: true,
        data: normalizedData,
        providerLastUpdated,
        fetchedAt: fetchTimestamp,
        sourceName: 'abuse.ch URLhaus (Recent Feeds)',
        isProxy: true,
        isGenuinelyEmpty: false
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err;
      }
      lastError = err;
    }
  }

  let message = lastError?.message || 'Failed to connect to abuse.ch URLhaus feed.';
  if (lastError?.name === 'TypeError' && message.toLowerCase().includes('failed to fetch')) {
    message = 'Network error or CORS restriction connecting to threat feed provider. A proxy is required to reach URLhaus from browser clients.';
  }

  return {
    success: false,
    data: [],
    providerLastUpdated: null,
    fetchedAt: fetchTimestamp,
    sourceName: 'abuse.ch URLhaus',
    isProxy: true,
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
    'Indicator (Reported URL)',
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
    escapeCell(r.evidence?.urlStatus || 'unknown'),
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

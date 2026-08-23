/**
 * qrClassifier.js
 *
 * Pure classification logic: given the raw decoded string from a QR
 * code, work out what kind of content it is and pull out the pieces
 * relevant to that type. Does not decide anything about risk — that
 * lives in urlAnalyzer.js / riskEngine.js.
 */

export const QR_TYPES = {
  URL: 'URL',
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  WIFI: 'WIFI',
  TEXT: 'TEXT',
};

const URL_LIKE = /^https?:\/\//i;
// A bare domain with no scheme, e.g. "example.com/path" — still worth
// treating as a URL destination rather than plain text.
const BARE_DOMAIN_LIKE = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s]*)?$/i;

function parseWifi(raw) {
  // WIFI:T:WPA;S:Campus_WiFi;P:password;H:false;;
  const fields = {};
  const body = raw.replace(/^WIFI:/i, '');
  const regex = /([A-Za-z]):((?:\\.|[^\\;])*);/g;
  let match;
  while ((match = regex.exec(body + ';')) !== null) {
    const key = match[1].toUpperCase();
    const value = match[2].replace(/\\(.)/g, '$1');
    fields[key] = value;
  }
  return {
    ssid: fields.S || '',
    password: fields.P || '',
    encryption: fields.T || 'nopass',
    hidden: fields.H === 'true',
  };
}

/**
 * Classifies raw decoded QR text and returns a structured object:
 * { type, raw, parsed }
 */
export function classifyQrContent(raw) {
  const text = (raw ?? '').trim();

  if (!text) {
    return { type: null, raw: text, parsed: null };
  }

  if (/^mailto:/i.test(text)) {
    const withoutScheme = text.replace(/^mailto:/i, '');
    const [address, query = ''] = withoutScheme.split('?');
    const params = new URLSearchParams(query);
    return {
      type: QR_TYPES.EMAIL,
      raw: text,
      parsed: {
        address,
        subject: params.get('subject') || '',
        body: params.get('body') || '',
      },
    };
  }

  if (/^tel:/i.test(text)) {
    return {
      type: QR_TYPES.PHONE,
      raw: text,
      parsed: { number: text.replace(/^tel:/i, '') },
    };
  }

  if (/^smsto:|^sms:/i.test(text)) {
    return {
      type: QR_TYPES.PHONE,
      raw: text,
      parsed: { number: text.replace(/^sms(to)?:/i, '').split(':')[0] },
    };
  }

  if (/^WIFI:/i.test(text)) {
    return {
      type: QR_TYPES.WIFI,
      raw: text,
      parsed: parseWifi(text),
    };
  }

  if (URL_LIKE.test(text)) {
    return { type: QR_TYPES.URL, raw: text, parsed: { url: text } };
  }

  // Bare domain without a scheme — still a website destination.
  if (BARE_DOMAIN_LIKE.test(text) && !text.includes(' ')) {
    return { type: QR_TYPES.URL, raw: text, parsed: { url: `https://${text}` } };
  }

  return { type: QR_TYPES.TEXT, raw: text, parsed: { text } };
}

import { useState } from 'react';
import { FiGlobe, FiMail, FiPhone, FiWifi, FiFileText, FiCopy, FiCheck } from 'react-icons/fi';
import { QR_TYPES } from '../utils/qrClassifier';

const TYPE_META = {
  [QR_TYPES.URL]: { icon: FiGlobe, label: 'WEBSITE' },
  [QR_TYPES.EMAIL]: { icon: FiMail, label: 'EMAIL' },
  [QR_TYPES.PHONE]: { icon: FiPhone, label: 'PHONE NUMBER' },
  [QR_TYPES.WIFI]: { icon: FiWifi, label: 'WI-FI NETWORK' },
  [QR_TYPES.TEXT]: { icon: FiFileText, label: 'PLAIN TEXT' },
};

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-accent transition-colors px-2.5 py-1.5 rounded-md border border-border hover:border-accent/40 cursor-pointer"
    >
      {copied ? (
        <span className="inline-flex items-center gap-1.5 text-success">
          <FiCheck size={13} /> Copied
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <FiCopy size={13} /> Copy
        </span>
      )}
    </button>
  );
}

export default function QRContent({ classified }) {
  const { type, parsed } = classified;
  const meta = TYPE_META[type] || TYPE_META[QR_TYPES.TEXT];
  const Icon = meta.icon;

  let displayValue;
  let copyValue;

  switch (type) {
    case QR_TYPES.URL:
      displayValue = parsed.url;
      copyValue = parsed.url;
      break;
    case QR_TYPES.EMAIL:
      displayValue = parsed.address;
      copyValue = parsed.address;
      break;
    case QR_TYPES.PHONE:
      displayValue = parsed.number;
      copyValue = parsed.number;
      break;
    case QR_TYPES.WIFI:
      displayValue = parsed.ssid;
      copyValue = parsed.password;
      break;
    default:
      displayValue = parsed.text;
      copyValue = parsed.text;
      break;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className="text-accent" />
        <span className="stage-eyebrow">{meta.label}</span>
      </div>

      {type === QR_TYPES.WIFI ? (
        <div className="space-y-2">
          <p className="font-mono text-sm text-text-primary break-all">{parsed.ssid || 'Unknown network'}</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm text-text-secondary break-all">
              {parsed.password || '(no password)'}
            </p>
            {parsed.password && <CopyButton value={parsed.password} />}
          </div>
          <p className="text-xs text-text-muted">Encryption: {parsed.encryption || 'None'}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="font-mono text-sm sm:text-base text-text-primary break-all">
            {displayValue}
          </p>
          <div className="shrink-0 flex items-center gap-2">
            <CopyButton value={copyValue} />
          </div>
        </div>
      )}
    </div>
  );
}

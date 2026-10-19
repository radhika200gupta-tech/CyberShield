import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiLink, FiCopy, FiCheck, FiExternalLink, FiAlertTriangle, 
  FiShield, FiInfo, FiLock, FiAlertOctagon
} from 'react-icons/fi';
import { ROUTES } from '../../../constants/routes';

/**
 * Safely defang a URL for text display to prevent accidental clicking or client autolinking
 */
function defangUrl(url) {
  if (!url) return '';
  return url
    .replace(/^https?:\/\//i, (match) => match.toLowerCase().startsWith('https') ? 'hxxps://' : 'hxxp://')
    .replace(/\./g, '[.]');
}

export default function ExtractedUrlsCard({ urls = [] }) {
  const navigate = useNavigate();
  const [copiedUrl, setCopiedUrl] = useState(null);

  const handleCopy = (rawUrl) => {
    navigator.clipboard.writeText(rawUrl);
    setCopiedUrl(rawUrl);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleHandoff = (rawUrl) => {
    navigate(ROUTES.URL_SCANNER, {
      state: { url: rawUrl, source: 'email-forensics' }
    });
  };

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-accent">
            <FiLink size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
              Extracted URLs & Hyperlinks ({urls.length})
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary">
              Defanged hyperlinks extracted from email headers and message content for safe inspection
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 self-start sm:self-auto font-medium">
          <FiShield size={13} />
          <span>Execution-Protected Sandbox</span>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 flex items-start gap-3 text-xs sm:text-sm text-text-secondary">
        <FiLock className="text-accent shrink-0 mt-0.5" size={17} />
        <div className="space-y-1">
          <span className="font-semibold text-text-primary">
            Safe Non-Execution Guarantee
          </span>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            All extracted destinations are rendered as passive text with defanged syntax (<code className="text-text-primary font-mono text-xs">hxxp[s]://</code>). CyberShield will never automatically query, ping, execute, or follow these links.
          </p>
        </div>
      </div>

      {/* URL Items */}
      {urls.length === 0 ? (
        <div className="py-10 text-center rounded-xl border border-border/60 bg-bg-surface/30">
          <FiInfo className="mx-auto text-text-muted mb-2.5" size={22} />
          <p className="text-sm font-semibold text-text-primary">No External URLs Discovered</p>
          <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-sm mx-auto leading-relaxed">
            Neither the supplied headers nor message content contain valid web URLs.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {urls.map((item, idx) => {
            const rawUrl = typeof item === 'string' ? item : item.url;
            const isIpHost = typeof item === 'object' && item.isIpHost;
            const isInsecureHttp = typeof item === 'object' && item.isInsecureHttp;
            const hostname = typeof item === 'object' ? item.hostname : '';
            const defanged = defangUrl(rawUrl);

            return (
              <div 
                key={idx}
                className="p-4 rounded-xl border border-border bg-bg-surface hover:border-border-hover transition-colors space-y-3"
              >
                {/* Host and indicators row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-bg-elevated border border-border text-text-muted">
                      Target #{idx + 1}
                    </span>

                    {hostname && (
                      <span className="text-sm sm:text-base font-mono font-semibold text-text-primary">
                        {hostname}
                      </span>
                    )}

                    {isIpHost && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <FiAlertOctagon size={12} />
                        Numeric IP Host
                      </span>
                    )}

                    {isInsecureHttp && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <FiAlertTriangle size={12} />
                        Insecure HTTP
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(rawUrl)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer"
                      title="Copy raw URL"
                    >
                      {copiedUrl === rawUrl ? (
                        <>
                          <FiCheck size={13} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <FiCopy size={13} />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleHandoff(rawUrl)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
                      title="Send URL to Smart URL Scanner"
                    >
                      <FiExternalLink size={13} />
                      <span>Check in Smart URL Scanner</span>
                    </button>
                  </div>
                </div>

                {/* Defanged display */}
                <div className="p-3 rounded-lg bg-bg-elevated border border-border/70 font-mono text-xs sm:text-sm text-text-secondary break-all select-all leading-relaxed">
                  {defanged}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

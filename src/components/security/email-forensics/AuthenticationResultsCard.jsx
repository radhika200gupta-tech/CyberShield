import { useState } from 'react';
import { 
  FiCheckCircle, FiXCircle, FiAlertCircle, FiHelpCircle, 
  FiShield, FiInfo, FiChevronDown, FiChevronUp, FiLock, FiAlertTriangle
} from 'react-icons/fi';

/**
 * Helper to render status badge and color
 */
function getStatusBadge(status) {
  switch (status?.toUpperCase()) {
    case 'PASS':
      return {
        label: 'PASS',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: FiCheckCircle,
        desc: 'Reported as authentic and verified by receiving MTA.'
      };
    case 'FAIL':
    case 'HARDFAIL':
      return {
        label: 'FAIL',
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        icon: FiXCircle,
        desc: 'Reported as explicitly failing authorization or verification.'
      };
    case 'SOFTFAIL':
    case 'NEUTRAL':
      return {
        label: status.toUpperCase(),
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        icon: FiAlertCircle,
        desc: 'Reported non-definitive verdict (softfail or neutral policy).'
      };
    case 'NONE':
    case 'NOT REPORTED':
      return {
        label: 'NOT REPORTED',
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        icon: FiHelpCircle,
        desc: 'No recorded verdict in Authentication-Results header.'
      };
    default:
      return {
        label: status ? status.toUpperCase() : 'UNKNOWN',
        bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
        icon: FiHelpCircle,
        desc: 'Unable to conclusively determine from available headers.'
      };
  }
}

export default function AuthenticationResultsCard({ authentication, parsedEmail }) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!authentication) return null;

  const { spf, dkim, dmarc, rawAuthResults, dkimSignaturePresent, dkimSignatures = [], domainAlignment } = authentication;

  const spfBadge = getStatusBadge(spf.status);
  const dkimBadge = getStatusBadge(dkim.status);
  const dmarcBadge = getStatusBadge(dmarc.status);

  const SpfIcon = spfBadge.icon;
  const DkimIcon = dkimBadge.icon;
  const DmarcIcon = dmarcBadge.icon;

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-accent">
            <FiShield size={20} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
              Reported Authentication Protocols
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Reported verdicts from receiver-generated <code className="text-accent font-mono">Authentication-Results</code> headers
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-surface border border-border text-xs font-mono text-text-muted self-start sm:self-auto">
          <FiLock size={13} className="text-accent" />
          <span>Passive Header Parsing Only</span>
        </div>
      </div>

      {/* Triad Metric Grid: SPF, DKIM, DMARC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* 1. SPF Panel */}
        <div className="rounded-xl border border-border/80 bg-bg-surface/60 p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-text-primary uppercase tracking-wider">
                SPF (Sender Policy)
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border ${spfBadge.bg}`}>
                <SpfIcon size={13} />
                {spfBadge.label}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Verifies if the sending mail server IP (<code className="text-text-primary font-mono text-xs">{spf.clientIp || 'not specified'}</code>) was authorized by the domain owner to transmit messages.
            </p>

            <div className="pt-2.5 border-t border-border/40 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-text-muted">
                <span>Evaluated Domain:</span>
                <span className="text-text-primary truncate max-w-[150px]">{spf.domain || 'Not reported'}</span>
              </div>
              {spf.details && (
                <div className="text-xs text-text-muted truncate">
                  Details: {spf.details}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3.5 pt-2 text-xs text-text-muted border-t border-border/30">
            Mechanism: IP-to-domain DNS TXT record match
          </div>
        </div>

        {/* 2. DKIM Panel */}
        <div className="rounded-xl border border-border/80 bg-bg-surface/60 p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-text-primary uppercase tracking-wider">
                DKIM (Cryptographic Sig)
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border ${dkimBadge.bg}`}>
                <DkimIcon size={13} />
                {dkimBadge.label}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Verifies if the cryptographic digital signature attached by the sender matches the public key in DNS and wasn&apos;t modified in transit.
            </p>

            <div className="pt-2.5 border-t border-border/40 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-text-muted">
                <span>Signing Domain:</span>
                <span className="text-text-primary truncate max-w-[150px]">{dkim.domain || (dkimSignatures[0]?.domain) || 'Not reported'}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>DKIM Signature Present:</span>
                <span className={dkimSignaturePresent ? 'text-emerald-400' : 'text-text-muted'}>
                  {dkimSignaturePresent ? 'Yes (header found)' : 'No signature'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-2 text-xs text-text-muted border-t border-border/30">
            Mechanism: Public-key RSA/Ed25519 hash validation
          </div>
        </div>

        {/* 3. DMARC Panel */}
        <div className="rounded-xl border border-border/80 bg-bg-surface/60 p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-text-primary uppercase tracking-wider">
                DMARC (Alignment & Policy)
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border ${dmarcBadge.bg}`}>
                <DmarcIcon size={13} />
                {dmarcBadge.label}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Enforces policy alignment between visible From domain and authenticated SPF/DKIM domains, specifying action (<code className="text-text-primary font-mono text-xs">{dmarc.action || 'none'}</code>).
            </p>

            <div className="pt-2.5 border-t border-border/40 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-text-muted">
                <span>Policy Target:</span>
                <span className="text-text-primary truncate max-w-[150px]">{dmarc.domain || 'Not reported'}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Published Policy:</span>
                <span className="text-text-primary uppercase">{dmarc.action || 'Not reported'}</span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-2 text-xs text-text-muted border-t border-border/30">
            Mechanism: Domain alignment + spoofing rejection policy
          </div>
        </div>

      </div>

      {/* Domain Alignment Summary Bar */}
      {domainAlignment && (
        <div className="p-4 rounded-xl bg-bg-surface border border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="space-y-1">
            <span className="font-semibold text-text-primary flex items-center gap-1.5">
              <span>Domain Alignment Cross-Check</span>
              <span className="text-xs text-text-muted font-normal">(RFC 7489)</span>
            </span>
            <p className="text-text-muted text-xs sm:text-sm">
              DMARC requires the visible <strong className="text-text-secondary">From:</strong> address domain to align with the authenticated SPF or DKIM domain.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono bg-bg-elevated">
              <span className="text-text-muted">SPF Align:</span>
              <span className={domainAlignment.spfAligned ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {domainAlignment.spfAligned ? 'ALIGNED' : 'MISALIGNED'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono bg-bg-elevated">
              <span className="text-text-muted">DKIM Align:</span>
              <span className={domainAlignment.dkimAligned ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {domainAlignment.dkimAligned ? 'ALIGNED' : 'MISALIGNED'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Limitations & Verification Disclaimer Notice */}
      <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 flex items-start gap-3 text-xs sm:text-sm text-text-secondary">
        <FiAlertTriangle className="text-accent shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <span className="font-semibold text-text-primary">
            Forensic Scope & Verification Notice
          </span>
          <p className="text-xs text-text-muted leading-relaxed">
            These authentication evaluations represent <strong>recorded results</strong> logged by the recipient mail transfer agent (MTA) when the message arrived. This tool parses existing headers locally in your browser and does not perform active outbound DNS queries or cryptographic signature verification. A missing authentication header does not automatically prove phishing, as some legitimate forwarding relays strip or alter headers.
          </p>
        </div>
      </div>

      {/* Collapsible Raw Authentication Headers */}
      <div className="pt-1">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-mono text-accent hover:text-accent-hover cursor-pointer"
        >
          {showTechnicalDetails ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
          <span>{showTechnicalDetails ? 'Hide' : 'View'} Raw Authentication Evidence Fields</span>
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 p-3.5 rounded-lg bg-bg-surface border border-border/80 font-mono text-xs text-text-secondary space-y-3 overflow-x-auto">
            <div>
              <span className="text-text-muted block text-xs uppercase tracking-wider mb-1">Authentication-Results:</span>
              <pre className="p-3 rounded-lg bg-bg-elevated border border-border/50 whitespace-pre-wrap break-all text-text-primary leading-relaxed">
                {rawAuthResults || 'No Authentication-Results header was found in this email.'}
              </pre>
            </div>

            {dkimSignatures.length > 0 && (
              <div>
                <span className="text-text-muted block text-xs uppercase tracking-wider mb-1">
                  DKIM-Signature Header ({dkimSignatures.length} found):
                </span>
                {dkimSignatures.map((sig, idx) => (
                  <pre key={idx} className="p-3 rounded-lg bg-bg-elevated border border-border/50 whitespace-pre-wrap break-all text-text-primary mb-2 leading-relaxed">
                    {sig.raw}
                  </pre>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { 
  FiUser, FiCheckCircle, FiKey, FiAlertOctagon, FiSlash, FiShield, 
  FiExternalLink, FiChevronDown, FiChevronUp, FiInfo 
} from 'react-icons/fi';

export default function CompactExposureAndProfiles({
  publicProfiles = [],
  exposure = {}
}) {
  const [showHibpSpec, setShowHibpSpec] = useState(false);

  const hasProfiles = publicProfiles && publicProfiles.length > 0;
  const isExposed = exposure?.status === 'EXPOSURES_DETECTED' && exposure.records?.length > 0;
  const isUnavailable = exposure?.status === 'UNAVAILABLE';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      
      {/* 1. Public Profile Signals (Compact) */}
      <div className="bg-bg-elevated border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <FiUser size={18} className="text-accent" />
            <h4 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
              Public Profile Signals ({publicProfiles.length})
            </h4>
          </div>
          {hasProfiles && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Verified Public Registry
            </span>
          )}
        </div>

        {!hasProfiles ? (
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed py-2">
            No public avatar photos, user profiles, or open cryptographic identities were cataloged for this address in public registries.
          </p>
        ) : (
          <div className="space-y-3">
            {publicProfiles.map((prof, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-bg-surface border border-border/70">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {prof.avatarUrl ? (
                    <img
                      src={prof.avatarUrl}
                      alt={prof.displayName}
                      className="w-10 h-10 rounded-full border border-border object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <FiKey size={18} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm sm:text-base font-semibold text-text-primary truncate">
                        {prof.displayName}
                      </span>
                      {prof.verified && (
                        <FiCheckCircle size={14} className="text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-mono text-accent truncate">
                      {prof.source}
                    </div>
                    {prof.details && (
                      <div className="text-xs text-text-muted truncate mt-0.5">
                        {prof.details}
                      </div>
                    )}
                  </div>
                </div>

                {prof.url && (
                  <a
                    href={prof.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-border hover:border-accent/40 text-text-muted hover:text-accent transition-colors shrink-0"
                    title={`View ${prof.source}`}
                  >
                    <FiExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Exposure Intelligence (Compact) */}
      <div className="bg-bg-elevated border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <FiAlertOctagon size={18} className="text-accent" />
            <h4 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
              Breach & Exposure Telemetry
            </h4>
          </div>
          <span className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
            isExposed
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
          }`}>
            {isExposed ? `${exposure.records.length} Incidents (Demo Feed)` : 'Provider Unconfigured'}
          </span>
        </div>

        {isUnavailable ? (
          <div className="space-y-3 py-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <FiSlash size={16} className="shrink-0 text-zinc-400" />
              <span>Exposure checks unavailable — no provider configured.</span>
            </div>
            
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              An authorized breach-monitoring provider (such as Have I Been Pwned API v3) is required for live exposure checks. CyberShield adheres to strict privacy ethics: private API secrets are never embedded in client-side React code, and raw credential dumps or leaked passwords are never retrieved or stored.
            </p>

            {/* Expandable Phase 3 Integration Specification */}
            <div className="pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setShowHibpSpec(!showHibpSpec)}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-accent hover:underline cursor-pointer"
              >
                <FiInfo size={13} />
                <span>{showHibpSpec ? 'Hide Phase 3 HIBP Integration Spec' : 'View Phase 3 HIBP API Integration Spec'}</span>
                {showHibpSpec ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
              </button>

              {showHibpSpec && (
                <div className="mt-2.5 p-3.5 rounded-lg bg-bg-surface border border-border/70 space-y-2 text-xs font-mono text-text-secondary animate-fade-in">
                  <div className="text-xs uppercase font-bold text-text-muted">
                    Technical Specifications for Phase 3 Implementation:
                  </div>
                  <div className="space-y-1.5 leading-relaxed">
                    <div><strong className="text-text-primary">Target Endpoint:</strong> <code>GET /api/v3/breachedaccount/&#123;account&#125;</code></div>
                    <div><strong className="text-text-primary">Authentication:</strong> <code>hibp-api-key: [32-char-secret]</code> passed via backend server</div>
                    <div><strong className="text-text-primary">User-Agent:</strong> Required application identifier header</div>
                    <div><strong className="text-text-primary">Rate Limits:</strong> 600 - 100,000 RPM (HTTP 429 with Retry-After backoff)</div>
                    <div><strong className="text-text-primary">OpSec Isolation:</strong> Secret keys and CORS handling strictly deferred to backend microservice proxy</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isExposed ? (
          <div className="space-y-2.5">
            {exposure.records.map((rec, i) => (
              <div key={i} className="p-3 rounded-lg bg-bg-surface border border-rose-500/20 space-y-1 text-xs sm:text-sm">
                <div className="flex items-center justify-between font-semibold text-text-primary">
                  <span>{rec.breachName}</span>
                  <span className="text-xs font-mono text-text-muted">{rec.breachDate}</span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-2">
                  {rec.description}
                </p>
                {rec.dataClasses && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rec.dataClasses.map((dc, j) => (
                      <span key={j} className="text-xs font-mono px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-muted">
                        {dc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-text-muted py-2 flex items-center gap-2">
            <FiShield size={16} className="text-emerald-400" />
            <span>No public exposure records logged for this address in current feeds.</span>
          </div>
        )}
      </div>

    </div>
  );
}

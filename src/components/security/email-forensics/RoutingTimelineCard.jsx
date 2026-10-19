import { useState } from 'react';
import { 
  FiClock, FiServer, FiChevronDown, FiChevronUp, 
  FiAlertTriangle, FiInfo
} from 'react-icons/fi';

export default function RoutingTimelineCard({ routing = {} }) {
  const [expandedHops, setExpandedHops] = useState({});

  const { hops = [], originIp, finalMxHost, totalHops = 0 } = routing;

  const toggleHopRaw = (index) => {
    setExpandedHops(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleAllHops = () => {
    const allExpanded = Object.keys(expandedHops).length === hops.length && 
      Object.values(expandedHops).every(Boolean);

    if (allExpanded) {
      setExpandedHops({});
    } else {
      const next = {};
      hops.forEach((_, idx) => { next[idx] = true; });
      setExpandedHops(next);
    }
  };

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-accent">
            <FiServer size={20} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
              Email Routing & Relay Timeline
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Chronological reconstruction of Mail Transfer Agent (MTA) hops derived from <code className="text-accent font-mono">Received:</code> headers
            </p>
          </div>
        </div>

        {hops.length > 0 && (
          <button
            onClick={toggleAllHops}
            className="text-xs sm:text-sm font-mono text-accent hover:text-accent-hover self-start sm:self-auto cursor-pointer"
          >
            Toggle All Raw Headers
          </button>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 sm:p-4 rounded-xl bg-bg-surface border border-border/70">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">
            Total Relay Hops
          </span>
          <span className="text-sm sm:text-base font-mono font-bold text-text-primary mt-1 block">
            {totalHops} {totalHops === 1 ? 'MTA Hop' : 'MTA Hops'}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-bg-surface border border-border/70">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">
            Originating Server / IP
          </span>
          <span className="text-xs sm:text-sm font-mono font-medium text-text-primary truncate mt-1 block">
            {originIp || 'Not explicitly recorded'}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-bg-surface border border-border/70">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">
            Receiving Gateway MX
          </span>
          <span className="text-xs sm:text-sm font-mono font-medium text-text-primary truncate mt-1 block">
            {finalMxHost || 'Local / Internal MTA'}
          </span>
        </div>
      </div>

      {/* Forensic Caution Notice */}
      <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 flex items-start gap-3 text-xs sm:text-sm text-text-secondary">
        <FiAlertTriangle className="text-accent shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <span className="font-semibold text-text-primary">
            Untrusted Hops & Timeline Interpretation
          </span>
          <p className="text-xs text-text-muted leading-relaxed">
            In standard RFC 5322 delivery, each relaying mail server prepends a new <code className="text-text-secondary">Received:</code> header to the top of the message. We have ordered these hops <strong>chronologically</strong> (Hop #1 is the initial sender relay; Hop #{totalHops || 'N'} is the recipient&apos;s inbound gateway). 
            Note that <em>prior to the recipient&apos;s first trusted boundary server</em>, earlier Received headers could theoretically be injected or forged by an adversary.
          </p>
        </div>
      </div>

      {/* Timeline List */}
      {hops.length === 0 ? (
        <div className="py-8 text-center rounded-lg border border-border/60 bg-bg-surface/30">
          <FiInfo className="mx-auto text-text-muted mb-2" size={24} />
          <p className="text-sm font-medium text-text-primary">No Received: Headers Found</p>
          <p className="text-xs text-text-muted mt-1">
            The provided text does not contain any RFC-compliant Received lines.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/60">
          {hops.map((hop, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === hops.length - 1;
            const isExpanded = !!expandedHops[idx];

            return (
              <div key={idx} className="relative pl-12">
                {/* Node marker icon */}
                <div className={`absolute left-2.5 top-3.5 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold z-10 ${
                  isFirst
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : isLast
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-bg-elevated border-accent text-accent'
                }`}>
                  {hop.hopNumber}
                </div>

                {/* Hop Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-border bg-bg-surface/80 hover:border-border-hover transition-colors space-y-3">
                  
                  {/* Title row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-border/50">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-semibold text-text-primary">
                        {isFirst ? 'Origin Relay Hop #1' : isLast ? `Final Destination Inbound Gateway (Hop #${hop.hopNumber})` : `Intermediate Relay (Hop #${hop.hopNumber})`}
                      </span>

                      {isFirst && (
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          First Untrusted Relay Point
                        </span>
                      )}

                      {isLast && (
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Recipient Edge MX
                        </span>
                      )}
                    </div>

                    {hop.delayFromPreviousSec !== null && !isFirst && (
                      <span className="text-xs font-mono text-text-muted flex items-center gap-1">
                        <FiClock size={12} />
                        <span>
                          {hop.delayFromPreviousSec >= 0
                            ? `Transit delay: +${hop.delayFromPreviousSec}s`
                            : `Clock skew: ${hop.delayFromPreviousSec}s`}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Hop Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-text-muted uppercase">
                        <span>From Server / Reported Host:</span>
                        <span className="text-[10px] text-accent font-normal">Parsed Header</span>
                      </div>
                      <div className="text-text-primary break-all bg-bg-elevated/70 p-2.5 rounded-lg border border-border/50 text-xs sm:text-sm">
                        {hop.fromHost || hop.from || (hop.isOriginHop ? 'Origin client / Mail submission (no "from" token in header)' : 'Internal MTA relay (no "from" token in header)')}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-text-muted uppercase">
                        <span>By Receiving Host:</span>
                        <span className="text-[10px] text-accent font-normal">Parsed Header</span>
                      </div>
                      <div className="text-text-primary break-all bg-bg-elevated/70 p-2.5 rounded-lg border border-border/50 text-xs sm:text-sm">
                        {hop.byHost || hop.by || 'Unspecified receiving host in header'}
                      </div>
                    </div>
                  </div>

                  {/* Metadata line: IPs, Protocol, Timestamp */}
                  <div className="flex flex-wrap items-center gap-3.5 pt-1 text-xs font-mono text-text-secondary">
                    {hop.ips?.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-muted">IP:</span>
                        <span className="text-accent font-semibold">{hop.ips.join(', ')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <span>IP:</span>
                        <span className="italic">Not recorded in hop</span>
                      </div>
                    )}

                    {hop.withProtocol ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-muted">Protocol:</span>
                        <span className="text-text-primary">{hop.withProtocol}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <span>Protocol:</span>
                        <span className="italic">Standard SMTP</span>
                      </div>
                    )}

                    {(hop.formattedDate || hop.date || hop.timestamp) && (
                      <div className="flex items-center gap-1.5 ml-auto text-text-muted text-xs">
                        <FiClock size={12} />
                        <span>
                          {hop.formattedDate || (typeof hop.date === 'object' && hop.date ? hop.date.toUTCString() : String(hop.date || hop.timestamp))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Raw Header Toggle */}
                  <div className="pt-2 border-t border-border/40">
                    <button
                      onClick={() => toggleHopRaw(idx)}
                      className="flex items-center gap-1.5 text-xs font-mono text-accent hover:text-accent-hover cursor-pointer"
                    >
                      {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      <span>{isExpanded ? 'Hide Raw Header Evidence' : 'View Raw Received Header'}</span>
                    </button>

                    {isExpanded && (
                      <pre className="mt-2.5 p-3 rounded-lg bg-bg-elevated border border-border/60 text-xs font-mono text-text-primary whitespace-pre-wrap break-all leading-relaxed">
                        {hop.raw}
                      </pre>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

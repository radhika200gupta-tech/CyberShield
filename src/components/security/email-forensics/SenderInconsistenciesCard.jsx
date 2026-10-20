import { useState } from 'react';
import { 
  FiAlertTriangle, FiAlertOctagon, FiInfo, FiCheckCircle, 
  FiFilter, FiArrowRight, FiShield, FiTag, FiCornerDownRight
} from 'react-icons/fi';

function getSeverityBadge(severity) {
  switch (severity?.toLowerCase()) {
    case 'high':
      return {
        label: 'HIGH RISK',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        cardBorder: 'border-rose-500/30 bg-rose-500/[0.02]',
        icon: FiAlertOctagon
      };
    case 'medium':
      return {
        label: 'MEDIUM RISK',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        cardBorder: 'border-amber-500/30 bg-amber-500/[0.02]',
        icon: FiAlertTriangle
      };
    case 'low':
      return {
        label: 'LOW CAUTION',
        badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        cardBorder: 'border-yellow-500/30 bg-yellow-500/[0.02]',
        icon: FiInfo
      };
    case 'info':
    default:
      return {
        label: 'INFORMATIONAL',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        cardBorder: 'border-border/80 bg-bg-surface/50',
        icon: FiInfo
      };
  }
}

export default function SenderInconsistenciesCard({ findings = [], senderDiscrepancies = {} }) {
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filteredFindings = findings.filter(f => {
    if (filterSeverity === 'all') return true;
    return f.severity?.toLowerCase() === filterSeverity;
  });

  const highCount = findings.filter(f => f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;
  const lowCount = findings.filter(f => f.severity === 'low').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-accent">
            <FiShield size={20} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
              Sender & Domain Inconsistencies
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Evidence-based cross-examination of visible sender addresses, return paths, and authentication domains
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              filterSeverity === 'all'
                ? 'bg-accent text-white font-medium'
                : 'bg-bg-surface border border-border text-text-muted hover:text-text-primary'
            }`}
          >
            All ({findings.length})
          </button>
          {highCount > 0 && (
            <button
              onClick={() => setFilterSeverity('high')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                filterSeverity === 'high'
                  ? 'bg-rose-500 text-white font-medium'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              High ({highCount})
            </button>
          )}
          {mediumCount > 0 && (
            <button
              onClick={() => setFilterSeverity('medium')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                filterSeverity === 'medium'
                  ? 'bg-amber-500 text-white font-medium'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              Medium ({mediumCount})
            </button>
          )}
          {lowCount > 0 && (
            <button
              onClick={() => setFilterSeverity('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                filterSeverity === 'low'
                  ? 'bg-yellow-500 text-white font-medium'
                  : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
              }`}
            >
              Low ({lowCount})
            </button>
          )}
          {infoCount > 0 && (
            <button
              onClick={() => setFilterSeverity('info')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                filterSeverity === 'info'
                  ? 'bg-blue-500 text-white font-medium'
                  : 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
              }`}
            >
              Info ({infoCount})
            </button>
          )}
        </div>
      </div>

      {/* No findings empty state */}
      {findings.length === 0 ? (
        <div className="py-8 text-center rounded-lg border border-border/60 bg-bg-surface/30">
          <FiCheckCircle className="mx-auto text-emerald-400 mb-2" size={26} />
          <p className="text-sm font-medium text-text-primary">No Inconsistencies or Suspicious Indicators Detected</p>
          <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-md mx-auto">
            The visible sender domains, reply-to routing, and envelope return-paths match expected norms.
          </p>
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="py-6 text-center text-text-muted text-xs sm:text-sm">
          No findings matching severity filter &quot;{filterSeverity}&quot;.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredFindings.map((finding) => {
            const badge = getSeverityBadge(finding.severity);
            const Icon = badge.icon;

            return (
              <div 
                key={finding.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${badge.cardBorder}`}
              >
                {/* Header row: title, supporting header, badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <Icon size={18} className={badge.badgeClass.split(' ')[1]} />
                    <h4 className="text-sm sm:text-base font-semibold text-text-primary">
                      {finding.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-bg-surface border border-border text-text-muted">
                      Field: {finding.field}
                    </span>
                    <span className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded border ${badge.badgeClass}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="pt-3 text-sm text-text-secondary leading-relaxed">
                  {finding.explanation}
                </div>

                {/* Why it may matter */}
                {finding.whyItMatters && (
                  <div className="mt-3 p-3 rounded-lg bg-bg-surface/70 border border-border/50 text-xs sm:text-sm space-y-1">
                    <div className="font-semibold text-text-primary flex items-center gap-1.5">
                      <FiTag size={13} className="text-accent" />
                      <span>Why this matters:</span>
                    </div>
                    <p className="text-text-secondary leading-relaxed pl-4">
                      {finding.whyItMatters}
                    </p>
                  </div>
                )}

                {/* Recommended Next Step */}
                {finding.recommendation && (
                  <div className="mt-2.5 flex items-start gap-2 text-xs sm:text-sm text-text-primary font-mono">
                    <FiCornerDownRight size={14} className="text-accent shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-text-muted uppercase text-xs">Action:</strong> {finding.recommendation}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Educational Nuance Reminder */}
      <div className="p-4 rounded-xl bg-bg-surface border border-border/60 text-xs sm:text-sm text-text-muted leading-relaxed">
        <strong className="text-text-primary">Investigator Note:</strong> Domain differences between <code className="text-text-secondary">From:</code> and <code className="text-text-secondary">Reply-To:</code> or <code className="text-text-secondary">Return-Path:</code> are frequently used in targeted spear-phishing (to divert replies to attacker inboxes), but can also occur naturally in legitimate enterprise workflows (e.g. Zendesk, Salesforce, Mailchimp, or academic mailing lists). Cross-reference with authentication results before concluding malicious intent.
      </div>
    </div>
  );
}

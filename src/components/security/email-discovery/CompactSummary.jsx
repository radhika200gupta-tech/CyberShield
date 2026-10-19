import { 
  FiCheckCircle, FiPrinter, FiRefreshCw, FiAlertTriangle, FiTag, FiActivity, FiShield 
} from 'react-icons/fi';

export default function CompactSummary({
  discoveryData,
  onReset,
  onPrint
}) {
  if (!discoveryData) return null;

  const {
    email,
    counts = {},
    domainInfo,
    emailIntelligence,
    exposure,
    services = [],
    isSample,
    sampleScenarioTitle
  } = discoveryData;

  // 1. Checks completed — only checks that actually ran
  const checksCompleted = services.length;

  // 2. Signals found — number of supported findings (Confirmed + Possible Matches)
  const signalsFound = (counts.confirmed || 0) + (counts.possible || 0);

  // 3. Needs attention — only when legitimate evidence supports follow-up
  const disposableAttention = domainInfo?.isDisposable ? 1 : 0;
  const exposureAttention = (exposure?.status === 'EXPOSURES_DETECTED' && Array.isArray(exposure.records))
    ? exposure.records.length
    : 0;
  const needsAttentionCount = disposableAttention + exposureAttention;

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-4 sm:p-5 shadow-sm space-y-4 text-xs sm:text-sm">
      
      {/* Top: Target Email and Core Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">
            Investigated Target
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-mono font-bold text-text-primary break-all">
              {email}
            </span>

            {/* Subaddressing tag badge if present */}
            {emailIntelligence?.hasSubaddress && (
              <span 
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-400"
                title={`Subaddressing alias detected. Mail routes to ${emailIntelligence.baseEmail}`}
              >
                <FiTag size={12} />
                <span>+{emailIntelligence.subaddressTag} Alias</span>
              </span>
            )}

            {/* Demo indicator if applicable */}
            {isSample && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Demo: {sampleScenarioTitle}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-accent/40 text-accent hover:bg-accent/10 transition-colors font-mono text-xs sm:text-sm cursor-pointer"
              title="Print or export investigation summary"
            >
              <FiPrinter size={14} />
              <span>Print Report</span>
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border hover:bg-bg-surface text-text-secondary hover:text-text-primary transition-colors font-mono text-xs sm:text-sm cursor-pointer"
              title="Reset lookup"
            >
              <FiRefreshCw size={13} />
              <span>New Lookup</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom: The Three Clearly Labeled Pieces of Information (Requirement 4.A) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
        
        {/* Metric 1: Checks Completed */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-bg-surface border border-border/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <FiActivity size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">
              Checks Completed
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-text-primary">
              {checksCompleted} Checked
            </span>
          </div>
        </div>

        {/* Metric 2: Signals Found */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-bg-surface border border-border/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <FiCheckCircle size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">
              Signals Found
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-emerald-400">
              {signalsFound} {signalsFound === 1 ? 'Signal' : 'Signals'}
            </span>
          </div>
        </div>

        {/* Metric 3: Needs Attention */}
        <div className={`p-3.5 sm:p-4 rounded-xl bg-bg-surface border flex items-center gap-3 ${
          needsAttentionCount > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/70'
        }`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
            needsAttentionCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {needsAttentionCount > 0 ? <FiAlertTriangle size={16} /> : <FiShield size={16} />}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-mono uppercase tracking-wider text-text-muted block">
              Needs Attention
            </span>
            <span className={`text-sm sm:text-base font-mono font-bold ${
              needsAttentionCount > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {needsAttentionCount > 0 
                ? `${needsAttentionCount} Item${needsAttentionCount > 1 ? 's' : ''}` 
                : '0 Items (Clear)'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}

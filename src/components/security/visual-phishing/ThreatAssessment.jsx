import { 
  FiCheckCircle, FiShield, FiSliders, FiAlertOctagon 
} from 'react-icons/fi';

export default function ThreatAssessment({ result, onTabSelect = () => {} }) {
  if (!result) return null;

  const {
    risk,
    score,
    displayScore,
    isInsufficientEvidence,
    indicators = [],
    urgencyCount = 0,
    credentialCount = 0,
    urlCount = 0,
    impersonationCount = 0,
  } = result;

  const detectedCount = indicators.length;
  const primaryRecommendation = indicators[0]?.recommendation || 
    (isInsufficientEvidence 
      ? 'Do not treat unreadable content as safe. Verify directly through official portals.' 
      : 'No phishing cues identified in text. Continue normal verification caution.');

  return (
    <div className="flex flex-col gap-3.5 w-full min-w-0">
      
      {/* 1. SCORE HERO CARD (Compact, balanced) */}
      <div className={`p-4 rounded-xl border shadow-sm relative overflow-hidden ${risk.bg} ${risk.border}`}>
        <div className="flex items-center gap-4 relative z-10">
          
          {/* Radial score meter (Compact 68x68) */}
          <div className="w-[68px] h-[68px] rounded-full bg-bg-elevated border-2 border-border flex items-center justify-center shrink-0 relative shadow-md">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-border opacity-30" />
              {isInsufficientEvidence ? (
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray="6 6"
                  className="text-warning opacity-70"
                />
              ) : (
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 264} 264`}
                  className={`transition-all duration-1000 ${risk.color}`}
                />
              )}
            </svg>
            <div className="flex flex-col items-center">
              <span className={`text-xl font-display font-bold leading-none ${risk.color}`}>
                {isInsufficientEvidence ? (displayScore || '--') : score}
              </span>
              <span className="text-[9px] text-text-muted font-mono uppercase tracking-wider mt-0.5">
                {isInsufficientEvidence ? 'INCONCLUSIVE' : '/100'}
              </span>
            </div>
          </div>
          
          {/* Risk info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-mono font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded border ${risk.color} bg-bg-elevated/80 border-border/60`}>
                {risk.label}
              </span>
              {isInsufficientEvidence && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded border border-warning/40 bg-warning/20 text-warning uppercase">
                  UNVERIFIABLE
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed break-words line-clamp-2">
              {risk.summary}
            </p>
          </div>
        </div>

        {/* Compact 4-Metric Grid */}
        <div className="mt-3.5 pt-3 border-t border-border/40 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-bg-elevated/60 p-2 rounded-lg border border-border/40">
            <span className="block text-[10px] text-text-muted uppercase font-mono tracking-wider truncate mb-0.5">Urgency</span>
            <span className={`text-sm font-bold font-mono ${urgencyCount > 0 ? 'text-danger' : 'text-text-primary'}`}>
              {isInsufficientEvidence ? '—' : urgencyCount}
            </span>
          </div>
          <div className="bg-bg-elevated/60 p-2 rounded-lg border border-border/40">
            <span className="block text-[10px] text-text-muted uppercase font-mono tracking-wider truncate mb-0.5">Credential</span>
            <span className={`text-sm font-bold font-mono ${credentialCount > 0 ? 'text-danger' : 'text-text-primary'}`}>
              {isInsufficientEvidence ? '—' : credentialCount}
            </span>
          </div>
          <div className="bg-bg-elevated/60 p-2 rounded-lg border border-border/40">
            <span className="block text-[10px] text-text-muted uppercase font-mono tracking-wider truncate mb-0.5">Links</span>
            <span className={`text-sm font-bold font-mono ${urlCount > 0 ? 'text-danger' : 'text-text-primary'}`}>
              {isInsufficientEvidence ? '—' : urlCount}
            </span>
          </div>
          <div className="bg-bg-elevated/60 p-2 rounded-lg border border-border/40">
            <span className="block text-[10px] text-text-muted uppercase font-mono tracking-wider truncate mb-0.5">Brand</span>
            <span className={`text-sm font-bold font-mono ${impersonationCount > 0 ? 'text-warning' : 'text-text-primary'}`}>
              {isInsufficientEvidence ? '—' : impersonationCount}
            </span>
          </div>
        </div>
      </div>

      {/* 2. INSUFFICIENT EVIDENCE WARNING (if applicable) */}
      {isInsufficientEvidence && (
        <div className="p-3.5 rounded-xl bg-warning/15 border border-warning/40 text-xs flex items-start gap-2.5 shadow-sm">
          <FiAlertOctagon size={16} className="text-warning shrink-0 mt-0.5" />
          <div className="text-text-secondary leading-relaxed">
            <strong className="text-warning font-semibold block mb-0.5">Insufficient Evidence State</strong>
            Fewer than 3 readable words recognized. This scan is inconclusive. Do not interpret as safe.
          </div>
        </div>
      )}

      {/* 3. KEY THREAT FINDINGS (Top indicators list) */}
      <div className="bg-bg-elevated border border-border rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            Key Threat Findings ({detectedCount})
          </span>
          {detectedCount > 0 && (
            <button
              type="button"
              onClick={() => onTabSelect('evidence')}
              className="text-xs font-mono text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              All Rules &rarr;
            </button>
          )}
        </div>

        {detectedCount > 0 ? (
          <div className="space-y-1.5 max-h-[145px] overflow-y-auto custom-scrollbar pr-1">
            {indicators.slice(0, 3).map((ind, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface/50 border border-border/40 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                  <span className="font-semibold text-text-primary text-xs truncate">
                    {ind.category}
                  </span>
                  {ind.matchedText && (
                    <span className="text-xs font-mono text-accent truncate hidden sm:inline">
                      "{ind.matchedText}"
                    </span>
                  )}
                </div>
                <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded uppercase shrink-0 ${
                  ind.severity === 'High' ? 'text-danger bg-danger/10 border border-danger/20' : 'text-warning bg-warning/10 border border-warning/20'
                }`}>
                  {ind.severity}
                </span>
              </div>
            ))}
            {detectedCount > 3 && (
              <button
                type="button"
                onClick={() => onTabSelect('evidence')}
                className="text-xs text-text-muted hover:text-accent font-mono block text-center w-full py-1 cursor-pointer"
              >
                + {detectedCount - 3} more indicators in Evidence Matrix &darr;
              </button>
            )}
          </div>
        ) : isInsufficientEvidence ? (
          <p className="text-xs text-text-secondary italic py-1.5">
            No readable text available to match phishing indicators.
          </p>
        ) : (
          <div className="flex items-center gap-2 text-xs text-success py-1">
            <FiCheckCircle size={14} className="shrink-0" />
            <span>No deceptive language or credential harvesting cues detected.</span>
          </div>
        )}
      </div>

      {/* 4. PRIMARY ACTIONABLE RECOMMENDATION (Compact Callout) */}
      <div className="bg-surface/70 border border-border rounded-xl p-3.5 shadow-sm flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent shrink-0 mt-0.5">
          <FiShield size={14} />
        </div>
        <div className="flex-1 min-w-0 text-xs">
          <div className="flex items-center justify-between mb-1">
            <strong className="text-text-primary text-xs font-semibold uppercase tracking-wider">
              Immediate Guidance
            </strong>
            <button
              type="button"
              onClick={() => onTabSelect('recommendations')}
              className="text-xs font-mono text-accent hover:underline cursor-pointer"
            >
              Action Plan &rarr;
            </button>
          </div>
          <p className="text-text-secondary leading-relaxed text-xs line-clamp-2">
            {primaryRecommendation}
          </p>
        </div>
      </div>

    </div>
  );
}

export function ScoringBreakdownPanel({ result }) {
  if (!result) return null;
  const { scoringBreakdown, score, isInsufficientEvidence, risk } = result;

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <FiSliders className="text-accent" size={15} />
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
            Deterministic Scoring Arithmetic Breakdown
          </h4>
        </div>
        <span className="text-xs font-mono text-text-muted">
          Rule-Based Weights
        </span>
      </div>

      <div className="bg-surface/70 rounded-lg p-3.5 border border-border/60 space-y-2 font-mono text-xs">
        <div className="flex justify-between items-center text-text-muted border-b border-border/40 pb-1.5 text-xs uppercase font-semibold tracking-wider">
          <span>Evaluated Indicator Component</span>
          <span>Assigned Weight</span>
        </div>

        {scoringBreakdown?.detectedRules?.length > 0 ? (
          scoringBreakdown.detectedRules.map((r, i) => (
            <div key={i} className="flex justify-between items-center text-text-primary py-0.5">
              <span className="text-text-secondary truncate pr-2">• {r.category}</span>
              <span className="text-accent font-bold">+{r.weight}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between items-center text-text-muted py-1">
            <span>• No individual indicators triggered</span>
            <span>+0</span>
          </div>
        )}

        <div className="flex justify-between items-center text-text-primary border-t border-border/30 pt-2">
          <span className="text-text-secondary">Base Score Subtotal</span>
          <span className="font-bold">+{scoringBreakdown?.baseScore || 0}</span>
        </div>

        <div className="flex justify-between items-center text-text-primary">
          <span className="text-text-secondary text-xs">Multi-Signal Convergence Escalation (≥2 rules: +10, ≥4 rules: +10)</span>
          <span className="text-warning font-bold">+{scoringBreakdown?.compoundingBonus || 0}</span>
        </div>

        <div className="flex justify-between items-center border-t border-border pt-2 text-sm font-bold">
          <span className="text-text-primary">Final Calculated Risk Score</span>
          <span className={risk?.color || 'text-text-primary'}>
            {isInsufficientEvidence ? 'INCONCLUSIVE' : `${score} / 100`}
          </span>
        </div>
      </div>

      <p className="text-xs text-text-muted leading-relaxed font-sans">
        <strong>Calculation Logic:</strong> <code>Score = min(100, Base Detected Weights + Multi-Signal Escalation)</code>. The assessment relies strictly on transparent deterministic heuristics, with no non-deterministic AI generation or unverified scoring variance.
      </p>
    </div>
  );
}

export function RecommendationsPanel({ result }) {
  if (!result) return null;
  const { isInsufficientEvidence, indicators = [] } = result;
  const recommendations = Array.from(new Set(indicators.map(i => i.recommendation)));

  return (
    <div className="space-y-4">
      <div className="bg-bg-elevated border border-border rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <FiShield className="text-accent" size={16} />
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Defensive Action Plan & Security Guidance
            </h4>
          </div>
          <span className="text-xs font-mono text-text-muted uppercase">
            Analyst Action Checklist
          </span>
        </div>

        {isInsufficientEvidence ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-warning/10 border border-warning/30 text-xs flex items-start gap-3">
              <FiAlertOctagon className="text-warning shrink-0 mt-0.5" size={16} />
              <div className="text-text-secondary leading-relaxed space-y-1">
                <strong className="text-warning block font-semibold">Caution: Inconclusive Text Scan</strong>
                Because fewer than 3 words were recognized in this screenshot, this image cannot be verified. Do NOT treat the lack of alerts as proof of safety.
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-surface/60 border border-border/50 space-y-1">
                <strong className="text-text-primary block font-semibold text-xs">1. Out-of-Band Verification</strong>
                <p className="text-text-secondary leading-relaxed text-xs">If this notification claims urgent action from an institution or IT department, reach out through an official, independently verified telephone number or bookmark.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-surface/60 border border-border/50 space-y-1">
                <strong className="text-text-primary block font-semibold text-xs">2. High-Resolution Re-Upload</strong>
                <p className="text-text-secondary leading-relaxed text-xs">Provide an uncropped, high-resolution screenshot if you would like CyberShield's on-device OCR engine to analyze visible typography.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.length > 0 ? (
              <div className="space-y-2.5">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-lg bg-surface/60 border border-border/50 text-xs">
                    <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                    <div className="flex-1 text-text-secondary leading-relaxed">
                      <strong className="text-text-primary font-semibold block mb-0.5 text-xs">Priority Directive #{i + 1}</strong>
                      {rec}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-xs flex items-start gap-3">
                <FiCheckCircle className="text-success shrink-0 mt-0.5" size={16} />
                <div className="text-text-secondary leading-relaxed">
                  <strong className="text-success block font-semibold mb-0.5 text-xs">No Suspicious Text Identified</strong>
                  No overt phishing or social engineering language was identified in the readable text. Continue adhering to standard cybersecurity hygiene: verify the sender's full email address and never enter credentials on unfamiliar web domains.
                </div>
              </div>
            )}

            {/* Standard Incident Response Protocols */}
            <div className="mt-4 pt-3 border-t border-border/50">
              <h5 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
                Standard Incident Response Recommendations
              </h5>
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface/40 border border-border/40 space-y-1">
                  <span className="text-accent font-semibold block text-xs">• Do Not Click Links</span>
                  <span className="text-text-secondary leading-relaxed text-xs">Avoid clicking buttons, short links, or QR codes presented in suspicious screenshots.</span>
                </div>
                <div className="p-3 rounded-lg bg-surface/40 border border-border/40 space-y-1">
                  <span className="text-accent font-semibold block text-xs">• Check Official Portals</span>
                  <span className="text-text-secondary leading-relaxed text-xs">Directly type the authentic domain into your browser address bar.</span>
                </div>
                <div className="p-3 rounded-lg bg-surface/40 border border-border/40 space-y-1">
                  <span className="text-accent font-semibold block text-xs">• Rotate Credentials If Entered</span>
                  <span className="text-text-secondary leading-relaxed text-xs">If credentials or OTP codes were entered, immediately change the account password.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forensic Disclaimer */}
        <div className="pt-3 border-t border-border/40 text-xs text-text-muted leading-relaxed">
          <strong className="text-text-primary font-medium">Forensic Notice:</strong> This analysis was performed on-device using client-side optical character recognition and deterministic heuristics. It serves as an assistive investigative tool and does not guarantee an absolute safety warranty.
        </div>
      </div>
    </div>
  );
}

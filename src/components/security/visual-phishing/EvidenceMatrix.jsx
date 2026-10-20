import { useState } from 'react';
import { FiAlertTriangle, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function EvidenceMatrix({ result }) {
  const [expandedRule, setExpandedRule] = useState(null);

  if (!result || !result.allRulesEvaluated) return null;

  const toggleExpand = (id) => {
    setExpandedRule(prev => prev === id ? null : id);
  };

  const detectedCount = result.indicators.length;

  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-sm overflow-hidden w-full min-w-0">
      <div className="px-4 py-3 border-b border-border/50 bg-surface/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FiAlertTriangle className={detectedCount > 0 ? "text-warning" : "text-success"} size={14} />
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
            Heuristic Evidence Matrix
          </h4>
        </div>
        <span className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded border uppercase ${
          detectedCount > 0 ? 'text-warning bg-warning/10 border-warning/20' : 'text-success bg-success/10 border-success/20'
        }`}>
          {detectedCount} {detectedCount === 1 ? 'Rule Triggered' : 'Rules Triggered'}
        </span>
      </div>
      
      <div className="p-4 flex flex-col gap-2">
        <p className="text-xs text-text-secondary leading-relaxed mb-2">
          Transparent evaluation of deterministic text patterns checked against the extracted screenshot content:
        </p>

        <div className="flex flex-col divide-y divide-border/40">
          {result.allRulesEvaluated.map((rule) => {
            const isExpanded = expandedRule === rule.id;
            return (
              <div key={rule.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-2">
                <div 
                  onClick={() => toggleExpand(rule.id)}
                  className="flex items-center justify-between gap-3 cursor-pointer group hover:bg-surface/30 p-1.5 rounded transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {rule.detected ? (
                      <span className="w-2 h-2 rounded-full bg-danger shrink-0 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-border shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs ${rule.detected ? 'text-text-primary font-semibold' : 'text-text-muted font-medium'}`}>
                          {rule.category}
                        </span>
                        <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded uppercase ${
                          rule.severity === 'High' ? 'text-danger bg-danger/10 border border-danger/20' : 'text-warning bg-warning/10 border border-warning/20'
                        }`}>
                          {rule.severity}
                        </span>
                      </div>
                      {rule.detected && rule.matchedText && (
                        <p className="text-xs font-mono text-accent truncate mt-0.5">
                          Matched: <span className="underline decoration-accent/40 font-semibold">"{rule.matchedText}"</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded border uppercase ${
                      rule.detected 
                        ? 'text-danger bg-danger/10 border-danger/30' 
                        : 'text-text-muted bg-surface/50 border-border/50'
                    }`}>
                      {rule.detected ? 'DETECTED' : 'NOT FOUND'}
                    </span>
                    <button className="text-text-muted group-hover:text-text-primary transition-colors cursor-pointer">
                      {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible rule explanation */}
                {isExpanded && (
                  <div className="ml-4 pl-3 border-l-2 border-accent/40 bg-surface/30 p-3 rounded-r-lg space-y-2 text-xs animate-fade-in">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block">Pattern Description:</span>
                      <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{rule.description}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-warning block">Why This Is Suspicious:</span>
                      <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{rule.whySuspicious}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent block">Safe Action:</span>
                      <p className="text-xs text-text-primary mt-0.5 font-medium leading-relaxed">{rule.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

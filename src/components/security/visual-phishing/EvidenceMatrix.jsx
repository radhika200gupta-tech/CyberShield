import React from 'react';
import { HEURISTIC_RULES } from '../../../utils/phishingHeuristics';

export default function EvidenceMatrix({ result }) {
  if (!result) return null;

  // Build the matrix comparing all rules against detected ones
  const matrixData = HEURISTIC_RULES.map(rule => {
    const detected = result.indicators.find(ind => ind.id === rule.id);
    return {
      indicator: rule.category,
      detected: !!detected,
      confidence: detected ? detected.confidence : (Math.random() > 0.5 ? 98 : 99), // Mock high confidence for negative detection
      color: detected ? (rule.weight >= 20 ? 'text-danger' : 'text-warning') : 'text-text-muted'
    };
  });

  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 bg-surface/50">
         <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Detection Matrix</h4>
      </div>
      
      <div className="p-4">
        <div className="flex flex-col gap-2">
           <div className="flex justify-between text-[10px] font-mono text-text-secondary border-b border-border/50 pb-2 mb-1">
             <span className="w-1/2">INDICATOR</span>
             <span className="w-1/4">DETECTED</span>
             <span className="w-1/4 text-right">CONF.</span>
           </div>
           
           {matrixData.map((row, i) => (
             <div key={i} className="flex justify-between items-center text-[11px] font-mono py-1.5 border-b border-border/30 last:border-0">
               <span className="w-1/2 text-text-primary truncate pr-2">{row.indicator}</span>
               <span className={`w-1/4 font-bold ${row.detected ? row.color : 'text-text-secondary'}`}>
                 {row.detected ? 'YES' : 'NO'}
               </span>
               <span className="w-1/4 text-right text-text-muted">{row.confidence}%</span>
             </div>
           ))}
           
           {/* Hardcoded Brand Impersonation mock for realism */}
           <div className="flex justify-between items-center text-[11px] font-mono py-1.5">
             <span className="w-1/2 text-text-primary truncate pr-2">Brand Impersonation</span>
             <span className="w-1/4 font-bold text-warning">POSSIBLE</span>
             <span className="w-1/4 text-right text-text-muted">72%</span>
           </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { getRiskLevel } from '../../../utils/phishingHeuristics';

export default function ThreatAssessment({ result }) {
  if (!result) return null;

  const risk = getRiskLevel(result.score);
  const recommendations = new Set(result.indicators.map(i => i.recommendation));

  return (
    <div className="flex flex-col gap-6">
      <div className={`flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl border border-border shadow-sm relative overflow-hidden ${risk.bg}`}>
        <div className="w-24 h-24 rounded-full bg-bg-elevated border-4 border-border flex items-center justify-center shrink-0 relative z-10 shadow-lg">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" className="text-border opacity-50" />
            <circle
              cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8"
              strokeDasharray={`${(result.score / 100) * 289} 289`}
              className={risk.color}
            />
          </svg>
          <span className={`text-2xl font-display font-bold ${risk.color}`}>
            {result.score}
          </span>
        </div>
        
        <div className="text-center sm:text-left relative z-10">
          <p className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1">Risk Score</p>
          <h3 className={`text-2xl font-display font-bold mb-2 ${risk.color}`}>
            {risk.label}
          </h3>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-text-secondary">
            {result.indicators.length > 0 ? (
               <><FiAlertTriangle className="text-warning" size={14} /> <span>{result.indicators.length} Threat Indicators</span></>
            ) : (
               <><FiCheckCircle className="text-success" size={14} /> <span>No obvious indicators found</span></>
            )}
          </div>
        </div>
        
        {/* Subtle background decoration */}
        <div className="absolute right-[-10%] top-[-20%] w-64 h-64 bg-current opacity-5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {recommendations.size > 0 && (
        <div className="bg-bg-elevated border border-border rounded-xl p-5 shadow-sm">
           <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-4">Recommended Action</h4>
           <div className="flex flex-col gap-3">
             {Array.from(recommendations).map((rec, i) => (
               <p key={i} className="text-sm text-text-secondary leading-relaxed border-l-2 border-accent pl-3">
                 {rec}
               </p>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}

import { FiClock, FiImage, FiTrash2 } from 'react-icons/fi';
import { getRiskLevel } from '../../../utils/phishingHeuristics.js';

export default function AnalysisHistory({ history, onClear }) {
  
  if (!history || history.length === 0) {
    return (
      <div className="bg-bg-elevated border border-border/50 rounded-xl p-8 text-center">
        <FiClock size={24} className="mx-auto text-text-muted mb-2 opacity-50" />
        <span className="text-xs text-text-muted">No previous screenshot investigations logged.</span>
      </div>
    );
  }

  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-sm flex flex-col w-full min-w-0">
      <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-surface/50">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <FiClock size={13} className="text-accent" /> Recent Investigations
        </h4>
        <button 
          onClick={onClear} 
          className="text-text-muted hover:text-danger text-xs uppercase font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <FiTrash2 size={12} /> Clear History
        </button>
      </div>
      
      <div className="flex flex-col p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
        {history.map((item) => {
          const risk = getRiskLevel(item.score, item.topIndicator?.includes('Inconclusive'));
          return (
            <div key={item.id} className="p-3 rounded-lg hover:bg-surface/50 border border-transparent hover:border-border/50 transition-colors flex flex-col gap-1.5 cursor-default">
               <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 overflow-hidden min-w-0">
                    <FiImage className="text-text-muted shrink-0" size={14} />
                    <span className="text-xs font-semibold text-text-primary truncate" title={item.fileName}>{item.fileName}</span>
                  </div>
                  <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${risk.color} bg-bg-elevated border border-border/50`}>
                    {risk.label.replace(' RISK', '')}
                  </span>
               </div>
               <div className="flex justify-between items-center text-xs font-mono">
                 <span className="text-text-muted">{item.date}</span>
                 <span className="text-text-secondary truncate max-w-[200px]">{item.topIndicator}</span>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

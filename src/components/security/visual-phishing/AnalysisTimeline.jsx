import { FiClock, FiCheckCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnalysisTimeline({ events }) {
  const getIcon = (type) => {
    switch(type) {
      case 'success': return <FiCheckCircle className="text-success" size={14} />;
      case 'warning': return <FiAlertTriangle className="text-warning" size={14} />;
      case 'error': return <FiAlertTriangle className="text-danger" size={14} />;
      default: return <FiInfo className="text-accent" size={14} />;
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'success': return 'text-text-primary';
      case 'warning': return 'text-warning font-semibold';
      case 'error': return 'text-danger font-bold';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-sm h-full flex flex-col w-full min-w-0">
      <div className="px-4 py-3 border-b border-border/50 flex justify-between items-center shrink-0">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <FiClock size={13} className="text-accent" /> Analysis Telemetry Feed
        </h4>
        <span className="text-xs font-mono text-accent px-2 py-0.5 bg-accent/10 border border-accent/20 rounded uppercase tracking-wider animate-pulse">
          LIVE
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3 min-h-[150px]">
        {events.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-text-muted font-mono uppercase tracking-wider py-6">
            Awaiting image telemetry data...
          </div>
        ) : (
          <AnimatePresence>
            {events.map((evt) => (
              <motion.div 
                key={evt.id} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 border-b border-border/30 pb-2.5 last:border-0 last:pb-0"
              >
                <div className="mt-0.5 shrink-0">{getIcon(evt.type)}</div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs ${getColor(evt.type)} leading-snug break-words`}>{evt.msg}</span>
                  <span className="text-xs font-mono text-text-muted mt-0.5">{evt.time}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

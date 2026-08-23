import { motion } from 'framer-motion';
import { classNames } from '../../utils/formatters';

const COLOR_MAP = {
  primary: 'text-primary border-primary/20',
  accent: 'text-accent border-accent/20',
  success: 'text-success border-success/20',
  warning: 'text-warning border-warning/20',
  danger: 'text-danger border-danger/20',
};

export default function StatCard({ icon: Icon, label, value, suffix = '', trend, color = 'primary' }) {
  return (
    <div className="bg-surface border border-border/70 rounded-xl p-5 hover:bg-surface-hover shadow-[0_8px_30px_var(--shadow-color)] transition-all group relative overflow-hidden">
      {/* Subtle top edge glow based on color */}
      <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-${color} to-transparent opacity-20 group-hover:opacity-50 transition-opacity`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</p>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono font-semibold text-2xl sm:text-3xl text-text-primary mt-2 tracking-tight"
          >
            {value}<span className="text-text-muted text-xl">{suffix}</span>
          </motion.p>
          {trend && (
            <p className={classNames('text-[10px] mt-2 font-mono uppercase tracking-widest', trend.positive ? 'text-success' : 'text-danger')}>
              {trend.positive ? '▲' : '▼'} {trend.label}
            </p>
          )}
        </div>
        <div className={classNames('w-8 h-8 rounded flex items-center justify-center shrink-0 bg-surface/50 border', COLOR_MAP[color])}>
          <Icon size={14} />
        </div>
      </div>
    </div>
  );
}

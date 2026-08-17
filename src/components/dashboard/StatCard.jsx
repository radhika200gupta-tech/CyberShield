import { motion } from 'framer-motion';
import Card from '../common/Card';
import { classNames } from '../../utils/formatters';

const COLOR_MAP = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  accent: 'bg-accent/10 text-accent border-accent/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
};

export default function StatCard({ icon: Icon, label, value, suffix = '', trend, color = 'primary' }) {
  return (
    <Card hoverable>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-semibold text-2xl sm:text-3xl text-text-primary mt-2"
          >
            {value}{suffix}
          </motion.p>
          {trend && (
            <p className={classNames('text-xs mt-2 font-medium', trend.positive ? 'text-success' : 'text-danger')}>
              {trend.positive ? '↑' : '↓'} {trend.label}
            </p>
          )}
        </div>
        <div className={classNames('w-10 h-10 rounded-lg flex items-center justify-center border shrink-0', COLOR_MAP[color])}>
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );
}

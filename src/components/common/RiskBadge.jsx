import { FiShield, FiAlertTriangle, FiAlertOctagon, FiInfo } from 'react-icons/fi';
import { classNames } from '../../utils/formatters';

const CONFIG = {
  safe: { label: 'Safe', icon: FiShield, cls: 'text-success bg-success/10 border-success/25' },
  low: { label: 'Low Risk', icon: FiInfo, cls: 'text-accent bg-accent/10 border-accent/25' },
  medium: { label: 'Medium Risk', icon: FiAlertTriangle, cls: 'text-warning bg-warning/10 border-warning/25' },
  high: { label: 'High Risk', icon: FiAlertOctagon, cls: 'text-danger bg-danger/10 border-danger/25' },
};

export default function RiskBadge({ level = 'safe', size = 'md', showIcon = true, className = '' }) {
  const config = CONFIG[level] || CONFIG.safe;
  const Icon = config.icon;
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 border rounded-full font-medium',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1',
        config.cls,
        className
      )}
    >
      {showIcon && <Icon size={size === 'sm' ? 12 : 13} />}
      {config.label}
    </span>
  );
}

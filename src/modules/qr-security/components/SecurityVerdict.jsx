import { FiShield, FiAlertTriangle, FiAlertOctagon, FiEye } from 'react-icons/fi';
import { classNames } from '../../../utils/classNames';
import { recommendationFor } from '../utils/riskEngine';

const LEVEL_CONFIG = {
  SAFE: {
    icon: FiShield,
    text: 'text-success',
    badge: 'text-success bg-success/10 border-success/25',
    dot: '🟢',
  },
  CAUTION: {
    icon: FiEye,
    text: 'text-warning',
    badge: 'text-warning bg-warning/10 border-warning/25',
    dot: '🟡',
  },
  SUSPICIOUS: {
    icon: FiAlertTriangle,
    text: 'text-warning',
    badge: 'text-warning bg-warning/10 border-warning/25',
    dot: '🟠',
  },
  DANGEROUS: {
    icon: FiAlertOctagon,
    text: 'text-danger',
    badge: 'text-danger bg-danger/10 border-danger/25',
    dot: '🔴',
  },
};

export default function SecurityVerdict({ riskScore, riskLevel }) {
  const config = LEVEL_CONFIG[riskLevel?.key] || LEVEL_CONFIG.SAFE;
  const recommendation = recommendationFor(riskLevel?.key);

  return (
    <div>
      <span className="stage-eyebrow">Security verdict</span>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-display font-bold text-2xl text-text-primary">
            {riskScore}<span className="text-sm font-normal text-text-muted">/100</span>
          </span>
          <span
            className={classNames(
              'inline-flex items-center gap-1.5 border rounded-full font-semibold text-xs px-3 py-1',
              config.badge
            )}
          >
            <span aria-hidden="true">{config.dot}</span>
            {riskLevel.label}
          </span>
        </div>

        <div className="hairline" />

        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Recommendation</p>
          <p className="text-sm text-text-secondary">{recommendation}</p>
        </div>
      </div>
    </div>
  );
}

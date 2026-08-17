import { FiKey, FiLink, FiMail } from 'react-icons/fi';
import Card from '../common/Card';
import RiskBadge from '../common/RiskBadge';
import { EmptyState } from '../common/Table';

const TYPE_ICONS = { password: FiKey, url: FiLink, phishing: FiMail };

export default function RecentActivity({ activity }) {
  return (
    <Card>
      <h3 className="font-display font-semibold text-text-primary text-sm mb-4">Recent Activity</h3>
      {activity.length === 0 ? (
        <EmptyState title="No activity yet" description="Run a scan to see it show up here." />
      ) : (
        <ul className="space-y-1">
          {activity.map((item) => {
            const Icon = TYPE_ICONS[item.type];
            return (
              <li key={item.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <span className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                  <Icon className="text-text-secondary" size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary truncate">{item.label}</p>
                  <p className="text-xs text-text-muted">{item.time}</p>
                </div>
                <RiskBadge level={item.risk} size="sm" />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

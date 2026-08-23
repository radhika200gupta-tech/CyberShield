import { FiKey, FiLink, FiMail, FiCamera, FiMaximize2, FiActivity } from 'react-icons/fi';
import RiskBadge from '../common/RiskBadge';

const TYPE_ICONS = { password: FiKey, url: FiLink, phishing: FiMail, screenshot: FiCamera, qr: FiMaximize2, generic: FiActivity };

export default function RecentActivity({ activity }) {
  return (
    <div className="bg-bg-elevated/30 border border-border/50 rounded-xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Recent Activity Feed</h3>
        <span className="text-[10px] font-mono text-accent">LIVE</span>
      </div>
      
      {activity.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
          <p className="text-sm text-text-muted">No recent activity detected.</p>
        </div>
      ) : (
        <div className="relative flex-1">
          {/* Vertical connecting line */}
          <div className="absolute top-2 bottom-2 left-[11px] w-px bg-border/50" />
          
          <ul className="space-y-5">
            {activity.map((item) => {
              const Icon = TYPE_ICONS[item.type] || TYPE_ICONS.generic;
              return (
                <li key={item.id} className="relative flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 z-10 mt-0.5">
                    <Icon className="text-text-secondary" size={10} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs text-text-primary font-medium truncate">{item.label}</p>
                      <RiskBadge level={item.risk} size="sm" />
                    </div>
                    <p className="text-[10px] font-mono text-text-muted">{item.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

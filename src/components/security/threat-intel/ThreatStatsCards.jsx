import { FiDatabase, FiLink, FiAlertTriangle, FiActivity } from 'react-icons/fi';

/**
 * Summary statistics cards for Threat Intelligence Dashboard.
 * Dynamically calculated from genuine loaded dataset.
 */
export default function ThreatStatsCards({
  totalReports = 0,
  uniqueIndicators = 0,
  highSeverityCount = 0,
  onlineCount = 0,
  sourceName = 'Threat Intelligence Feed'
}) {
  const isUrlhaus = (sourceName || '').toLowerCase().includes('urlhaus');
  const providerLabel = isUrlhaus ? 'URLhaus' : 'telemetry';

  const cards = [
    {
      label: 'Total Reports Loaded',
      value: totalReports.toLocaleString(),
      subtext: `Genuine ${providerLabel} records`,
      icon: FiDatabase,
      color: 'text-accent',
      borderColor: 'border-accent/20'
    },
    {
      label: 'Unique Indicators',
      value: uniqueIndicators.toLocaleString(),
      subtext: 'Deduplicated malicious indicators',
      icon: FiLink,
      color: 'text-primary',
      borderColor: 'border-primary/20'
    },
    {
      label: 'High & Critical Severity',
      value: highSeverityCount.toLocaleString(),
      subtext: 'Internally assessed heuristics',
      icon: FiAlertTriangle,
      color: 'text-danger',
      borderColor: 'border-danger/30'
    },
    {
      label: 'Reported Online URLs',
      value: onlineCount.toLocaleString(),
      subtext: 'Feed status: online (unverified reachability)',
      icon: FiActivity,
      color: 'text-success',
      borderColor: 'border-success/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-surface/80 border ${card.borderColor} backdrop-blur-md rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-accent/40 transition-all`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
                {card.label}
              </span>
              <div className={`p-2 rounded-lg bg-bg-elevated border border-border/60 ${card.color} shrink-0`}>
                <Icon size={16} />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl sm:text-3xl font-display font-bold ${card.color}`}>
                {card.value}
              </span>
            </div>

            <div className="mt-2 text-xs text-text-secondary flex items-center justify-between border-t border-border/40 pt-2">
              <span className="truncate">{card.subtext}</span>
              {card.label.includes('Severity') && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/20 shrink-0 font-medium">
                  Assessed
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

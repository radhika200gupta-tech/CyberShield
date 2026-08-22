import { FiCheck, FiAlertTriangle, FiAlertOctagon } from 'react-icons/fi';
import { classNames } from '../utils/classNames';

const STATUS_STYLE = {
  ok: { text: 'text-success', border: 'border-success/30', icon: FiCheck },
  warn: { text: 'text-warning', border: 'border-warning/30', icon: FiAlertTriangle },
  danger: { text: 'text-danger', border: 'border-danger/30', icon: FiAlertOctagon },
};

function Segment({ label, value, status, note }) {
  const style = STATUS_STYLE[status];
  const Icon = style.icon;
  return (
    <div className="flex flex-col items-start">
      <span
        className={classNames(
          'px-2.5 py-1 rounded border font-mono text-xs sm:text-sm break-all bg-bg-elevated',
          style.border,
          status === 'ok' ? 'text-text-primary' : style.text
        )}
      >
        {value}
      </span>
      <span className={classNames('mt-1.5 inline-flex items-center gap-1 text-[11px]', style.text)}>
        <Icon size={11} />
        {note}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wide text-text-muted">{label}</span>
    </div>
  );
}

export default function UrlDna({ intelligence, ruleBreakdown }) {
  const byId = Object.fromEntries(ruleBreakdown.map((r) => [r.id, r]));
  const is = (id) => !!byId[id]?.triggered;

  const segments = [];

  segments.push({
    label: 'Protocol',
    value: `${intelligence.protocol.toLowerCase()}://`,
    status: is('https') ? 'warn' : 'ok',
    note: is('https') ? 'No encryption' : 'HTTPS',
  });

  if (intelligence.subdomain) {
    const subWarn = is('many-subdomains') || is('many-hyphens');
    segments.push({
      label: 'Subdomain',
      value: intelligence.subdomain,
      status: subWarn ? 'warn' : 'ok',
      note: subWarn ? 'Unusual subdomain' : 'Standard',
    });
  }

  const domainWarn = is('ip-hostname') || is('punycode');
  segments.push({
    label: 'Domain',
    value: intelligence.domain,
    status: intelligence.isIp ? 'danger' : domainWarn ? 'warn' : 'ok',
    note: intelligence.isIp ? 'Raw IP address' : domainWarn ? 'Punycode / lookalike' : 'Domain',
  });

  if (intelligence.path && intelligence.path !== '/') {
    const pathWarn = is('suspicious-keyword');
    segments.push({
      label: 'Path',
      value: intelligence.path,
      status: pathWarn ? 'warn' : 'ok',
      note: pathWarn ? 'Sensitive keyword' : 'Path',
    });
  }

  if (intelligence.query && intelligence.query !== '—') {
    segments.push({
      label: 'Query',
      value: intelligence.query,
      status: is('suspicious-chars') ? 'warn' : 'ok',
      note: is('suspicious-chars') ? 'Unusual characters' : 'Parameters',
    });
  }

  if (intelligence.hasAt) {
    segments.push({
      label: 'Marker',
      value: '@',
      status: 'danger',
      note: 'Hides real destination',
    });
  }

  return (
    <div>
      <span className="stage-eyebrow">The link, piece by piece</span>
      <p className="mt-1 text-xs text-text-muted">
        The target broken into its structural pieces, examined one at a time.
      </p>

      <div className="mt-5 flex flex-wrap gap-x-1 gap-y-5">
        {segments.map((seg, i) => (
          <div key={`${seg.label}-${i}`} className="flex items-start">
            <Segment {...seg} />
            {i < segments.length - 1 && (
              <span className="text-text-muted/50 self-center px-1 mt-2 font-mono text-xs">/</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

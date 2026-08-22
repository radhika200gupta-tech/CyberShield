import { FiClock, FiTrash2 } from 'react-icons/fi';
import { classNames } from '../utils/classNames';

const DOT_COLOR = {
  safe: 'bg-success',
  medium: 'bg-warning',
  high: 'bg-danger',
};

const VERDICT_LABELS = {
  safe: 'Looks Safe',
  medium: 'Be Careful',
  high: 'Looks Dangerous',
  SAFE: 'Looks Safe',
  SUSPICIOUS: 'Be Careful',
  DANGEROUS: 'Looks Dangerous',
};

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function ScanHistory({ entries, onSelect, onClear }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiClock size={14} className="text-accent" />
          <h3 className="font-display font-semibold text-text-primary text-xs tracking-[0.14em] uppercase">
            Recent Checks
          </h3>
        </div>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-danger transition-colors cursor-pointer"
          >
            <FiTrash2 size={13} />
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-text-muted">No links checked yet. Paste a link above to test it.</p>
      ) : (
        <ul className="space-y-1">
          {entries.map((entry) => {
            const verdictText =
              VERDICT_LABELS[entry.level] ||
              VERDICT_LABELS[entry.verdict] ||
              entry.verdict;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entry)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <span
                    className={classNames(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      DOT_COLOR[entry.level] || DOT_COLOR.safe
                    )}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-text-primary truncate font-mono">
                      {entry.url}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {verdictText} · {timeAgo(entry.timestamp)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-mono font-medium text-text-secondary">
                    {entry.score}/100
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

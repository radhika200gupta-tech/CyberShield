import { classNames } from '../../../utils/classNames';

const DOT_STATE = {
  idle: 'bg-text-muted',
  active: 'bg-accent',
  detected: 'bg-success',
  error: 'bg-danger',
};

export default function ScanStatus({ state = 'idle', label }) {
  const pulsing = state === 'active';

  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">
      <span className="relative flex h-1.5 w-1.5">
        {pulsing && (
          <span
            className={classNames(
              'absolute inline-flex h-full w-full rounded-full animate-pulse-ring',
              DOT_STATE[state]
            )}
          />
        )}
        <span className={classNames('relative inline-flex rounded-full h-1.5 w-1.5', DOT_STATE[state])} />
      </span>
      {label}
    </span>
  );
}

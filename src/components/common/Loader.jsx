import { classNames } from '../../utils/formatters';

export default function Loader({ size = 'md', label, className = '' }) {
  const dims = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-[3px]' }[size];
  return (
    <div className={classNames('flex flex-col items-center justify-center gap-3', className)} role="status" aria-live="polite">
      <span className={classNames('border-border border-t-accent rounded-full animate-spin', dims)} />
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </div>
  );
}

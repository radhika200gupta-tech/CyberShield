import { classNames } from '../../utils/formatters';

export default function Card({ children, className = '', hoverable = false, glass = false, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={classNames(
        'rounded-card border border-border p-5',
        glass ? 'glass' : 'bg-surface',
        hoverable && 'transition-all duration-200 hover:border-border-hover hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_var(--shadow-color)]',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

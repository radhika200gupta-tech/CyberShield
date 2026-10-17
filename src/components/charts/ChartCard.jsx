export default function ChartCard({ title, subtitle, action, children }) {
  return (
    <div className="bg-surface border border-border/70 rounded-xl p-5 h-full flex flex-col hover:border-border shadow-[0_8px_30px_var(--shadow-color)] transition-colors w-full min-w-0">
      <div className="flex items-start justify-between border-b border-border/50 pb-3 mb-4 min-w-0 gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest truncate">{title}</h3>
          {subtitle && <p className="text-[10px] font-mono text-text-secondary mt-1 truncate">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1 w-full min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

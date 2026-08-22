export default function ChartCard({ title, subtitle, action, children }) {
  return (
    <div className="bg-bg-elevated/30 border border-border/50 rounded-xl p-5 h-full flex flex-col hover:border-border transition-colors">
      <div className="flex items-start justify-between border-b border-border/50 pb-3 mb-4">
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest">{title}</h3>
          {subtitle && <p className="text-[10px] font-mono text-text-secondary mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
}

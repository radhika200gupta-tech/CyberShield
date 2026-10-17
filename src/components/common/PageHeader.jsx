export default function PageHeader({ title, description, badge, icon, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 w-full min-w-0">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {icon && (
          <div className="flex shrink-0 h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-2xl text-primary">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-display font-semibold text-text-primary break-words">
              {title}
            </h1>
            {badge && (
              <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-medium font-mono uppercase tracking-wider shrink-0">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-text-secondary break-words">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

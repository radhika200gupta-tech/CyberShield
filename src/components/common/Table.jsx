export default function Table({ columns, children }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-elevated">
            {columns.map((col) => (
              <th key={col.key} className="text-left font-medium text-text-secondary px-4 py-3 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-4">
          <Icon className="text-text-muted" size={22} />
        </div>
      )}
      <h4 className="font-medium text-text-primary mb-1">{title}</h4>
      {description && <p className="text-sm text-text-muted max-w-xs">{description}</p>}
    </div>
  );
}

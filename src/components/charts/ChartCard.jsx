import Card from '../common/Card';

export default function ChartCard({ title, subtitle, action, children }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-text-primary text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

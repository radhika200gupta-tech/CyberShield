import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-accent/30 rounded px-3 py-2 shadow-xl text-xs font-mono">
      <p className="text-text-muted mb-1">{label}</p>
      <p className="text-accent font-semibold">{payload[0].value} THREATS DETECTED</p>
    </div>
  );
}

export default function WeeklyThreatsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} vertical={false} />
        <XAxis dataKey="day" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} fontFamily="monospace" />
        <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} fontFamily="monospace" />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-accent)', strokeOpacity: 0.2 }} />
        <Area
          type="monotone"
          dataKey="threats"
          stroke="var(--color-accent)"
          strokeWidth={2}
          fill="url(#threatGradient)"
          dot={{ r: 3, fill: 'var(--color-accent)', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: 'var(--color-primary)', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

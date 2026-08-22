import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black border border-danger/30 rounded px-3 py-2 shadow-xl text-xs font-mono">
      <p className="text-text-muted mb-1">{label}</p>
      <p className="text-danger font-semibold">{payload[0].value} THREATS DETECTED</p>
    </div>
  );
}

export default function WeeklyThreatsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="day" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} fontFamily="monospace" />
        <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} fontFamily="monospace" />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(239, 68, 68, 0.2)' }} />
        <Area type="monotone" dataKey="threats" stroke="#EF4444" strokeWidth={2} fill="url(#threatGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black border border-primary/30 rounded px-3 py-2 shadow-xl text-xs font-mono">
      <p className="text-text-muted mb-1">{label}</p>
      <p className="text-primary font-semibold">{payload[0].value} SCANS PERFORMED</p>
    </div>
  );
}

export default function MonthlyScansChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} fontFamily="monospace" />
        <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} fontFamily="monospace" />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="scans" radius={[2, 2, 0, 0]} maxBarSize={32}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill="var(--color-primary)" fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

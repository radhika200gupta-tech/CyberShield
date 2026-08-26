import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-black border border-primary/30 rounded px-3 py-2 shadow-xl text-xs font-mono">
      <p className="text-text-primary mb-1">{item.payload.name}</p>
      <p className="text-primary font-semibold">{item.value} DETECTED</p>
    </div>
  );
}

export default function ThreatCategoryChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart 
        data={data} 
        layout="vertical" 
        margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
        <XAxis type="number" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} fontFamily="monospace" />
        <YAxis type="category" dataKey="name" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} width={120} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
          {data?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill="var(--color-primary)" opacity={1 - (index * 0.15)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

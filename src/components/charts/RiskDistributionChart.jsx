import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-black border border-border/50 rounded px-3 py-2 shadow-xl text-xs font-mono">
      <p className="text-text-primary"><span style={{color: item.payload.color}} className="font-bold">{item.name}</span>: {item.value}%</p>
    </div>
  );
}

function renderLegend({ payload }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-2 text-[10px] font-mono text-text-secondary tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

export default function RiskDistributionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie 
          data={data} 
          dataKey="value" 
          nameKey="name" 
          innerRadius={70} 
          outerRadius={90} 
          paddingAngle={5} 
          strokeWidth={0}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}

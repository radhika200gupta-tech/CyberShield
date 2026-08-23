import { useOnScreen } from '../../hooks/useOnScreen';
import { formatCompactNumber } from '../../utils/formatters';
import { stats } from '../../data/mockLanding';

function StatItem({ stat }) {
  const [ref] = useOnScreen();
  const isDecimal = !Number.isInteger(stat.value);
  // Guarantee deterministic formatting without animation
  const formattedValue = isDecimal ? stat.value.toFixed(1) : (stat.value >= 1000000 ? (stat.value / 1000000).toFixed(1) + 'M' : stat.value >= 1000 ? (stat.value / 1000).toFixed(0) + 'K' : stat.value);

  return (
    <div ref={ref} className="text-center flex flex-col items-center">
      <div className="relative">
        <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full opacity-50" />
        <p className="font-display font-bold text-4xl sm:text-5xl bg-clip-text text-transparent bg-gradient-to-br from-white via-text-primary to-accent tabular-nums tracking-tight relative z-10">
          {formattedValue}{stat.suffix}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="w-8 h-[1px] bg-border/80 hidden sm:block" />
        <p className="text-[10px] font-mono font-semibold text-text-secondary tracking-[0.2em] uppercase">{stat.label}</p>
        <div className="w-8 h-[1px] bg-border/80 hidden sm:block" />
      </div>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="border-y border-border/50 bg-bg-elevated/40 py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-12 sm:gap-8 relative z-10">
        {stats.map((stat) => (
          <StatItem key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  );
}

import { useOnScreen } from '../../hooks/useOnScreen';
import { useCountUp } from '../../hooks/useCountUp';
import { formatCompactNumber } from '../../utils/formatters';
import { stats } from '../../data/mockLanding';

function StatItem({ stat }) {
  const [ref, isVisible] = useOnScreen();
  const isDecimal = !Number.isInteger(stat.value);
  const count = useCountUp(stat.value, { start: isVisible, decimals: isDecimal ? 1 : 0, duration: 1600 });

  return (
    <div ref={ref} className="text-center">
      <p className="font-display font-semibold text-3xl sm:text-4xl text-gradient tabular-nums">
        {isDecimal ? count.toFixed(1) : formatCompactNumber(count)}
        {stat.suffix}
      </p>
      <p className="text-sm text-text-secondary mt-2">{stat.label}</p>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="border-y border-border bg-bg-elevated py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <StatItem key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

const STEPS = [
  'QR code decoded',
  'Content identified',
  'Analyzing destination',
  'Checking security patterns',
  'Calculating risk',
];

const STEP_DURATION = 220;

export default function ScanProgress({ onComplete }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= STEPS.length) {
      const timeout = setTimeout(onComplete, 260);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setActiveIndex((i) => i + 1), STEP_DURATION);
    return () => clearTimeout(timeout);
  }, [activeIndex, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-card border border-border bg-surface p-6 sm:p-8 relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-card">
        <div className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-accent/10 to-transparent animate-scan" />
      </div>

      <div className="relative flex items-center gap-3 mb-5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-accent animate-pulse-ring" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
        </span>
        <h3 className="font-display font-semibold text-text-primary tracking-wide text-sm sm:text-base">
          ANALYZING QR CODE
        </h3>
      </div>

      <ul className="relative space-y-3">
        {STEPS.map((step, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex;
          return (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span
                className={
                  done
                    ? 'flex items-center justify-center w-5 h-5 rounded-full bg-success/15 text-success shrink-0'
                    : current
                    ? 'flex items-center justify-center w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0'
                    : 'flex items-center justify-center w-5 h-5 rounded-full border border-border text-text-muted shrink-0'
                }
              >
                {done && <FiCheck size={13} />}
              </span>
              <span
                className={
                  done ? 'text-text-primary' : current ? 'text-text-primary font-medium' : 'text-text-muted'
                }
              >
                {step}
              </span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}

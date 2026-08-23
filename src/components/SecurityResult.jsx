import { motion } from 'framer-motion';
import {
  FiRotateCcw,
  FiLink,
  FiCheckCircle,
  FiShield,
  FiAlertTriangle,
  FiAlertOctagon,
} from 'react-icons/fi';
import UrlDna from './UrlDna';
import { classNames } from '../utils/classNames';

const LEVEL_CONFIG = {
  safe: {
    icon: FiShield,
    ring: 'stroke-success',
    text: 'text-success',
    badge: 'text-success bg-success/10 border-success/25',
    label: 'Looks Safe',
  },
  medium: {
    icon: FiAlertTriangle,
    ring: 'stroke-warning',
    text: 'text-warning',
    badge: 'text-warning bg-warning/10 border-warning/25',
    label: 'Be Careful',
  },
  high: {
    icon: FiAlertOctagon,
    ring: 'stroke-danger',
    text: 'text-danger',
    badge: 'text-danger bg-danger/10 border-danger/25',
    label: 'Looks Dangerous',
  },
};

function RiskRing({ score, level }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.safe;
  const Icon = config.icon;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="5"
        />
        <motion.circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className={config.ring}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Icon className={config.text} size={16} />
        <span className="font-display font-bold text-lg text-text-primary mt-0.5">{score}</span>
      </div>
    </div>
  );
}

/**
 * SecurityResult
 *
 * Streamlined result screen:
 * 1. Target URL header & structural tags
 * 2. Animated score ring + verdict badge + recommendation
 * 3. "Here's why" bullet list showing triggered rules
 * 4. URL DNA breakdown ("The link, piece by piece")
 * 5. Reset button to check another link
 */
export default function SecurityResult({ result, url, onReset }) {
  const { score, classification, ruleBreakdown, intelligence } = result;
  const level = classification?.level || 'safe';
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.safe;

  const triggeredRules = ruleBreakdown ? ruleBreakdown.filter((rule) => rule.triggered) : [];
  const highSeverity = triggeredRules.filter((r) => r.points >= 20).length;

  const chips = [
    { label: 'Protocol', value: intelligence?.protocol, warn: intelligence?.protocol !== 'HTTPS' },
    { label: 'Domain', value: intelligence?.domain, warn: intelligence?.isIp },
    { label: 'Path', value: intelligence?.path, warn: false },
    { label: 'Query', value: intelligence?.query, warn: false },
  ].filter((c) => c.value && c.value !== '—');

  const recommendation =
    level === 'high'
      ? 'Do not enter passwords, payment information, or personal details on this website.'
      : level === 'medium'
      ? 'Verify the domain carefully before entering sensitive information.'
      : 'No major security indicators were detected. Always verify the domain before entering sensitive information.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-card border border-border bg-surface overflow-hidden"
    >
      <div className="p-6 sm:p-10">
        {/* 1. Header showing target URL */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <span className="stage-eyebrow">Target</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-success font-medium">
              <FiCheckCircle size={12} />
              Analysis complete
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border bg-bg-elevated px-4 py-3.5">
            <FiLink size={15} className="text-accent shrink-0" />
            <p className="font-mono text-sm sm:text-base text-text-primary break-all leading-relaxed">
              {url}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {chips.map((chip) => (
              <div key={chip.label} className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wide text-text-muted">
                  {chip.label}
                </span>
                <span
                  className={classNames(
                    'text-xs font-mono',
                    chip.warn ? 'text-warning' : 'text-text-secondary'
                  )}
                >
                  {chip.value}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-text-muted">Checks</span>
              <span className="text-xs font-mono text-text-secondary">
                {ruleBreakdown?.length || 0} checked
              </span>
            </div>
          </div>
        </div>

        <div className="hairline mt-6 mb-8" />

        <div className="space-y-10">
          {/* 2. Security Verdict: animated score ring + badge */}
          <div className="stage">
            <span className="stage-eyebrow">Verdict</span>

            <div className="mt-4 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <RiskRing score={score} level={level} />

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                  <span
                    className={classNames(
                      'inline-flex items-center gap-1.5 border rounded-full font-semibold text-xs px-3 py-1',
                      config.badge
                    )}
                  >
                    {config.label}
                  </span>
                </div>

                <p className="mt-3 text-xs text-text-muted">
                  {triggeredRules.length} indicator{triggeredRules.length === 1 ? '' : 's'} detected
                  {highSeverity > 0 && ` · ${highSeverity} high-severity`}
                </p>

                <div className="mt-4 hairline" />

                <p className="mt-3 text-xs uppercase tracking-wide text-text-muted mb-1">
                  Recommendation
                </p>
                <p className="text-sm text-text-secondary">{recommendation}</p>
              </div>
            </div>
          </div>

          {/* 3. Here's why list */}
          <div className="stage">
            <span className="stage-eyebrow">Here's why</span>

            {triggeredRules.length === 0 ? (
              <div className="mt-4 flex items-start gap-2.5 text-sm text-success">
                <FiCheckCircle size={16} className="mt-0.5 shrink-0" />
                <p>No major suspicious indicators were detected.</p>
              </div>
            ) : (
              <>
                <p className="mt-1 text-xs text-text-muted">
                  {triggeredRules.length} security finding{triggeredRules.length === 1 ? '' : 's'} surfaced during analysis:
                </p>
                <ul className="mt-4 space-y-3.5">
                  {triggeredRules.map((rule) => (
                    <li key={rule.id} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-warning/15 text-warning">
                        <FiAlertTriangle size={11} />
                      </span>
                      <div>
                        <p className="font-medium text-text-primary">{rule.name}</p>
                        <p className="text-xs text-text-muted mt-0.5">{rule.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* 4. The link, piece by piece (UrlDna) */}
          <div className="stage">
            <UrlDna intelligence={intelligence} ruleBreakdown={ruleBreakdown} />
          </div>
        </div>
      </div>

      {/* 5. Reset button */}
      <div className="border-t border-border bg-bg-elevated/50 p-5 sm:p-6 flex justify-center">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg border border-border text-text-primary hover:border-border-hover hover:bg-surface-hover transition-all duration-200 cursor-pointer"
        >
          <FiRotateCcw size={15} />
          Check another link
        </motion.button>
      </div>
    </motion.div>
  );
}

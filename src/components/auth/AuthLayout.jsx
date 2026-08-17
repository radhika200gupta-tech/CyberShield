import { motion } from 'framer-motion';
import { FiShield, FiCheck } from 'react-icons/fi';
import Logo from '../common/Logo';

const POINTS = [
  'Real-time phishing and URL threat scanning',
  'Entropy-based password strength analysis',
  'A security score that tracks your progress',
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-16">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="font-display font-semibold text-2xl text-text-primary">{title}</h1>
            {subtitle && <p className="text-sm text-text-secondary mt-2">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>

      <div className="hidden lg:flex relative flex-col justify-between bg-bg-elevated border-l border-border p-12 overflow-hidden">
        <div className="absolute inset-0 grid-fade pointer-events-none opacity-70" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
            <FiShield className="text-white" size={26} />
          </div>
          <h2 className="font-display font-semibold text-3xl text-text-primary leading-tight max-w-sm">
            Security that keeps up with modern threats.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-text-secondary">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                  <FiCheck className="text-success" size={12} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-text-muted font-mono">Phase 1 — Frontend Preview</p>
      </div>
    </div>
  );
}

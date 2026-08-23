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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-bg relative overflow-hidden">
      {/* Background glow & subtle grid */}
      <div className="absolute inset-0 grid-fade pointer-events-none opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Logo */}
      <div className="mb-8 relative z-10">
        <Logo />
      </div>

      {/* Main Unified Container */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="w-full max-w-[900px] bg-bg-elevated/90 border border-border/50 rounded-2xl shadow-2xl flex flex-col lg:flex-row overflow-hidden relative z-10 backdrop-blur-xl"
      >
        {/* LOGIN SIDE */}
        <div className="flex-1 p-8 sm:p-12 lg:p-14 border-b lg:border-b-0 lg:border-r border-border/50">
          <h1 className="font-display font-bold text-[28px] sm:text-3xl text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-[15px] text-text-secondary mt-3">{subtitle}</p>}
          <div className="mt-10">{children}</div>
        </div>

        {/* SECURITY SIDE */}
        <div className="flex-1 bg-surface/40 p-8 sm:p-12 lg:p-14 relative overflow-hidden flex flex-col justify-center">
          {/* Subtle background for security side */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
              <FiShield className="text-white" size={24} />
            </div>
            <h2 className="font-display font-semibold text-2xl sm:text-3xl text-text-primary leading-tight">
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
        </div>
      </motion.div>
    </div>
  );
}

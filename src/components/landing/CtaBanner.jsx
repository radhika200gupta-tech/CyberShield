import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import Button from '../common/Button';
import { ROUTES } from '../../constants/routes';

export default function CtaBanner() {
  const navigate = useNavigate();
  return (
    <section className="py-24 sm:py-28 relative overflow-hidden">
      {/* Deep cybersecurity background */}
      <div className="absolute inset-0 bg-bg" />
      
      {/* Subtle radar / target visual */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-[0.03] mix-blend-plus-lighter">
        <div className="absolute inset-0 rounded-full border border-accent" />
        <div className="absolute inset-4 rounded-full border border-accent border-dashed" />
        <div className="absolute inset-16 rounded-full border border-accent" />
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(56,189,248,0.2)_180deg,transparent_360deg)] animate-[spin_4s_linear_infinite] rounded-full" />
      </div>
      
      {/* Radial blue glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="relative text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-[0.2em]">Security Systems Ready</span>
          </div>
          
          <h2 className="font-display font-semibold text-4xl sm:text-5xl text-text-primary tracking-tight">
            Run your scan.
          </h2>
          <p className="text-text-secondary text-lg mt-5 max-w-lg mx-auto">
            Get a clear answer in under a minute.
          </p>
          
          <div className="mt-10 mb-14">
            <Button variant="primary" size="lg" icon={FiArrowRight} iconPosition="right" onClick={() => navigate(ROUTES.LOGIN)}>
              Get Started
            </Button>
          </div>

          {/* Compact capability badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['URL ANALYSIS', 'PHISHING DETECTION', 'PASSWORD CHECK', 'QR INSPECTION'].map(capability => (
              <div key={capability} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface/50 border border-border/50 shadow-sm">
                <div className="w-1 h-1 rounded-full bg-text-muted" />
                <span className="text-[9px] font-mono font-medium text-text-secondary tracking-widest uppercase">{capability}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

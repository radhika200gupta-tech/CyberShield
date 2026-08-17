import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiPlay, FiShield, FiLock, FiLink } from 'react-icons/fi';
import Button from '../common/Button';
import { ROUTES } from '../../constants/routes';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-36 pb-24 sm:pt-44 sm:pb-32 overflow-hidden">
      <div className="absolute inset-0 grid-fade pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border border-border bg-surface rounded-full pl-1.5 pr-3.5 py-1.5 mb-6"
          >
            <span className="bg-primary/20 text-accent text-[10px] font-semibold px-2 py-0.5 rounded-full">NEW</span>
            <span className="text-xs text-text-secondary">AI-powered phishing detection is live</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-semibold text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] text-text-primary tracking-tight"
          >
            Stay a step ahead of{' '}
            <span className="text-gradient">every threat.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-text-secondary text-lg mt-6 max-w-lg"
          >
            CyberShield AI checks your passwords, links, and emails against real threat patterns in real time — so you catch the phishing attempt before it catches you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 mt-9"
          >
            <Button variant="primary" size="lg" icon={FiArrowRight} iconPosition="right" onClick={() => navigate(ROUTES.LOGIN)}>
              Start Free Scan
            </Button>
            <Button variant="outline" size="lg" icon={FiPlay} onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              See How It Works
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <ScanVisual />
        </motion.div>
      </div>
    </section>
  );
}

function ScanVisual() {
  return (
    <div className="relative rounded-card border border-border bg-surface glass p-6 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FiShield className="text-accent" size={16} />
          <span className="text-sm font-medium text-text-primary">Live scan</span>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Active
        </span>
      </div>

      <div className="relative rounded-lg bg-bg-elevated border border-border p-4 font-mono text-xs text-text-secondary overflow-hidden">
        <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-accent/0 via-accent/10 to-accent/0 animate-scan" />
        <p>&gt; scanning secure-paypal-verify.com</p>
        <p className="text-warning">&gt; domain age: 3 days</p>
        <p className="text-danger">&gt; blacklist match found</p>
        <p className="text-text-primary">&gt; verdict: high risk</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          { icon: FiLock, label: 'Passwords', value: '76', color: 'text-success' },
          { icon: FiLink, label: 'URLs Safe', value: '269', color: 'text-accent' },
          { icon: FiShield, label: 'Score', value: '82', color: 'text-primary' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-bg-elevated p-3 text-center">
            <item.icon className={`mx-auto mb-1.5 ${item.color}`} size={16} />
            <p className="text-lg font-display font-semibold text-text-primary">{item.value}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

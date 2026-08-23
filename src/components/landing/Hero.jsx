import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiPlay, FiShield, FiLock, FiLink } from 'react-icons/fi';
import Button from '../common/Button';
import { ROUTES } from '../../constants/routes';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-36 pb-24 sm:pt-44 sm:pb-32 overflow-hidden bg-bg">
      {/* Hero Background Grid */}
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-40 mix-blend-plus-lighter" />
      
      {/* Atmospheric Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div>


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
            CyberShield checks your passwords, links, and emails against real threat patterns in real time — so you catch the phishing attempt before it catches you.
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
    <div className="scan-visual relative rounded-[20px] border border-border/50 bg-bg-elevated/80 p-6 shadow-[0_20px_50px_var(--shadow-color)] overflow-hidden backdrop-blur-xl">

      
      <div className="flex items-center justify-between mb-5 relative z-10 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <FiShield className="text-accent" size={16} />
          <span className="text-sm font-semibold text-text-primary tracking-widest uppercase">Live Scan</span>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-success uppercase tracking-[0.2em]">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Active
        </span>
      </div>

      <div className="relative rounded-[14px] bg-surface border border-border/40 p-5 font-mono text-xs text-text-secondary overflow-hidden shadow-inner flex flex-col gap-4">
        <div className="absolute inset-x-0 h-32 bg-gradient-to-b from-primary/0 via-primary/5 to-primary/0 animate-scan pointer-events-none" />
        
        <div>
          <span className="text-text-muted text-[10px] uppercase tracking-widest block mb-1">Scanning</span>
          <span className="text-text-primary font-medium text-sm">secure-paypal-verify.com</span>
        </div>

        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          <span className="text-text-muted uppercase tracking-wider">Domain Age</span>
          <span className="text-warning">3 DAYS</span>
          
          <span className="text-text-muted uppercase tracking-wider">Threat Signal</span>
          <span className="text-danger">BLACKLIST MATCH</span>
          
          <span className="text-text-muted uppercase tracking-wider">Verdict</span>
          <span className="text-danger font-semibold bg-danger/10 px-2 py-0.5 rounded w-fit">HIGH RISK</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5 relative z-10">
        {[
          { icon: FiLock, label: 'Passwords', value: '76', color: 'text-success' },
          { icon: FiLink, label: 'URLs Safe', value: '269', color: 'text-success' },
          { icon: FiShield, label: 'Score', value: '82', color: 'text-primary' },
        ].map((item) => (
          <div key={item.label} className="rounded-[14px] border border-border/50 bg-surface/50 p-3 text-center">
            <item.icon className={`mx-auto mb-2 ${item.color}`} size={16} />
            <p className="text-lg font-display font-semibold text-text-primary">{item.value}</p>
            <p className="text-[9px] font-mono font-medium text-text-muted mt-1 uppercase tracking-widest">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

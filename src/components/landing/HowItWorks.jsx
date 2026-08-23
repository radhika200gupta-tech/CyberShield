import { motion } from 'framer-motion';
import { SectionHeading } from './Features';
import { securityWorkflow } from '../../data/mockLanding';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-bg-elevated/30 border-y border-border/50 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full flex justify-between pointer-events-none opacity-20">
        <div className="w-px h-full bg-gradient-to-b from-transparent via-accent to-transparent" />
        <div className="w-px h-full bg-gradient-to-b from-transparent via-accent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          eyebrow="Security Workflow"
          title="Automated Threat Analysis Pipeline"
          description="How CyberShield processes and neutralizes threats in real-time."
        />

        <div className="relative grid md:grid-cols-4 gap-8 mt-20">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[28px] left-[12.5%] right-[12.5%] h-[2px] bg-border/60" />
          <div className="hidden md:block absolute top-[28px] left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0 animate-pulse" />

          {securityWorkflow.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 w-14 h-14 rounded-full bg-surface border border-border/80 flex items-center justify-center mb-6 shadow-lg shadow-black/20 group">
                {/* Node glowing ring */}
                <div className="absolute inset-0 rounded-full border border-accent/30 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500" />
                <span className="font-mono text-sm font-bold text-accent tracking-widest">{item.step}</span>
              </div>
              
              <h3 className="font-display font-semibold text-lg text-text-primary mb-3">{item.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed px-2">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

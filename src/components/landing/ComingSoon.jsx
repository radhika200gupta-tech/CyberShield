import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiMap, FiCpu, FiZap, FiCamera, FiArrowRight } from 'react-icons/fi';
import { SectionHeading } from './Features';
import { comingSoon } from '../../data/mockLanding';

const ICONS = { eye: FiEye, map: FiMap, cpu: FiCpu, zap: FiZap, camera: FiCamera };

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <section className="py-24 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading 
          title="Coming Soon" 
          description="We are actively expanding CyberShield with new threat intelligence and detection capabilities."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {comingSoon.map((item, i) => {
            const Icon = ICONS[item.icon];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              >
                <div 
                  onClick={() => item.path && navigate(item.path)}
                  className="group relative h-full flex flex-col p-6 rounded-[18px] bg-bg-elevated/80 border border-border/50 hover:border-accent/30 hover:bg-bg-elevated cursor-pointer transition-all duration-[250ms] hover:-translate-y-[3px] hover:shadow-[0_8px_30px_-12px_var(--shadow-color)] overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border group-hover:via-accent/40 to-transparent transition-colors duration-300" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-colors duration-500" />
                  
                  <div className="flex items-center gap-3 mb-5 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-surface border border-border/60 flex items-center justify-center group-hover:bg-accent/5 group-hover:border-accent/20 transition-all duration-300">
                      <Icon className="text-accent" size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] font-semibold text-text-muted uppercase tracking-widest group-hover:text-text-secondary transition-colors duration-300">Coming Soon</span>
                    </div>
                  </div>
                  
                  <h3 className="font-display font-semibold text-lg text-text-primary mb-2 relative z-10 group-hover:text-accent transition-colors duration-300">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed flex-1 relative z-10">{item.description}</p>
                  
                  <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4 relative z-10">
                    <span className="text-xs font-semibold text-text-secondary group-hover:text-accent transition-colors duration-300">
                      Explore Preview
                    </span>
                    <FiArrowRight size={14} className="text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

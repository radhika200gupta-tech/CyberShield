import { motion } from 'framer-motion';
import { FiEye, FiMap, FiCpu, FiZap, FiCamera } from 'react-icons/fi';
import { SectionHeading } from './Features';
import { comingSoon } from '../../data/mockLanding';

const ICONS = { eye: FiEye, map: FiMap, cpu: FiCpu, zap: FiZap, camera: FiCamera };

export default function ComingSoon() {
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading 
          title="Coming Soon" 
          description="We are actively expanding CyberShield AI with new threat intelligence and detection capabilities."
        />

        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {comingSoon.map((item, i) => {
            const Icon = ICONS[item.icon];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col items-center justify-center p-6 rounded-card border border-dashed border-border bg-bg-elevated/50 text-center opacity-70 cursor-not-allowed"
              >
                <Icon size={24} className="text-text-muted mb-3" />
                <h4 className="text-sm font-medium text-text-primary">{item.title}</h4>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

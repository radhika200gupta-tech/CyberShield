import { motion } from 'framer-motion';
import { FiShield, FiKey, FiLink, FiMail, FiActivity, FiCpu } from 'react-icons/fi';
import Card from '../common/Card';
import { features } from '../../data/mockLanding';

const ICONS = { shield: FiShield, key: FiKey, link: FiLink, mail: FiMail, activity: FiActivity, cpu: FiCpu };

export default function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to spot a threat first"
          description="Six focused tools that cover the surfaces attackers actually use — links, credentials, and inboxes."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
          {features.map((feature, i) => {
            const Icon = ICONS[feature.icon];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              >
                <Card hoverable className="h-full">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <Icon className="text-accent" size={18} />
                  </div>
                  <h3 className="font-display font-semibold text-text-primary mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, center = true }) {
  return (
    <div className={center ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}>
      {eyebrow && (
        <span className="text-xs font-mono font-medium text-accent tracking-wider uppercase">{eyebrow}</span>
      )}
      <h2 className="font-display font-semibold text-3xl sm:text-4xl text-text-primary mt-3 tracking-tight">{title}</h2>
      {description && <p className="text-text-secondary mt-4 leading-relaxed">{description}</p>}
    </div>
  );
}

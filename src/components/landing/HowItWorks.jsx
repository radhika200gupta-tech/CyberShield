import { motion } from 'framer-motion';
import { SectionHeading } from './Features';
import { howItWorks } from '../../data/mockLanding';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Process"
          title="Three steps between you and a clear verdict"
          description="No dashboards to configure first. Paste a signal, get an answer."
        />

        <div className="relative grid md:grid-cols-3 gap-8 mt-16">
          <div className="hidden md:block absolute top-6 left-[16.6%] right-[16.6%] h-px bg-border" />
          {howItWorks.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="relative"
            >
              <div className="relative z-10 w-12 h-12 rounded-full bg-bg border-2 border-primary flex items-center justify-center font-mono text-sm font-semibold text-accent mb-5">
                {item.step}
              </div>
              <h3 className="font-display font-semibold text-lg text-text-primary mb-2">{item.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

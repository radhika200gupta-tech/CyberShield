import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';
import Card from '../common/Card';
import { SectionHeading } from './Features';
import { testimonials } from '../../data/mockLanding';

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 bg-bg-elevated border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Testimonials"
          title="Trusted by teams who can't afford to guess"
        />

        <div className="grid md:grid-cols-3 gap-5 mt-14">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="h-full flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <FiStar key={idx} className="text-warning fill-warning" size={14} />
                  ))}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-semibold">
                    {t.avatarInitials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

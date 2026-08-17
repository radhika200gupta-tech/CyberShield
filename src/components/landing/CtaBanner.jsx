import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import Button from '../common/Button';
import { ROUTES } from '../../constants/routes';

export default function CtaBanner() {
  const navigate = useNavigate();
  return (
    <section className="py-24 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-card border border-border bg-gradient-to-br from-primary/15 via-surface to-surface p-10 sm:p-16 text-center overflow-hidden"
        >
          <div className="absolute inset-0 grid-fade pointer-events-none opacity-60" />
          <div className="relative">
            <h2 className="font-display font-semibold text-3xl sm:text-4xl text-text-primary tracking-tight">
              Run your first scan in under a minute
            </h2>
            <p className="text-text-secondary mt-4 max-w-md mx-auto">
              No setup, no credit card. See exactly what CyberShield AI would have caught.
            </p>
            <div className="mt-8">
              <Button variant="primary" size="lg" icon={FiArrowRight} iconPosition="right" onClick={() => navigate(ROUTES.SIGNUP)}>
                Get Started Free
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

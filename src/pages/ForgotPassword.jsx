import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle, FiInfo } from 'react-icons/fi';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROUTES } from '../constants/routes';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const validate = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email address is required.');
      return false;
    }
    // Plausible email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address (e.g. name@company.com).');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (resetPassword) {
        await resetPassword({ email: email.trim() });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      setSubmittedEmail(email.trim());
      setIsSubmitted(true);
      showToast('Password recovery request processed.', 'info');
    } catch (err) {
      console.error('Password reset simulation error:', err);
      setError('Unable to process recovery request at this time. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleResetForm = () => {
    setIsSubmitted(false);
    setEmail('');
    setError('');
  };

  return (
    <AuthLayout
      title="Account Recovery"
      subtitle="Enter your registered email address to receive password recovery instructions."
    >
      {isSubmitted ? (
        <div className="space-y-6 animate-fade-in">
          {/* Recovery Feedback Card */}
          <div className="p-5 rounded-xl border border-success/30 bg-success/10 space-y-3">
            <div className="flex items-center gap-2.5 text-success font-semibold text-sm">
              <FiCheckCircle size={18} className="shrink-0" />
              <span>Recovery Request Submitted</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              If an account associated with <strong className="text-text-primary font-mono">{submittedEmail}</strong> exists, password reset instructions have been dispatched.
            </p>
          </div>

          {/* Truthful Demo Environment Notice */}
          <div className="p-4 rounded-xl border border-border/70 bg-bg-elevated/40 space-y-2 text-xs text-text-muted">
            <div className="flex items-center gap-2 font-semibold text-accent uppercase tracking-wide">
              <FiInfo size={14} className="shrink-0" />
              <span>Demo Prototype Notice</span>
            </div>
            <p className="leading-relaxed">
              This college project currently operates in a client-side demonstration mode. In a production environment connected to a live backend (e.g., Spring Boot / Node.js), a cryptographically secure, time-limited reset token with a single-use callback URL would be emailed to the verified recipient.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={handleResetForm}
              size="md"
            >
              Try Another Email
            </Button>
            <Link
              to={ROUTES.LOGIN}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-accent hover:underline transition-colors"
            >
              <FiArrowLeft size={16} /> Return to Log In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Input
            label="Registered Email"
            type="email"
            name="email"
            icon={FiMail}
            placeholder="you@company.com"
            value={email}
            onChange={handleEmailChange}
            error={error}
            autoComplete="email"
            disabled={isSubmitting}
          />

          <div className="pt-2 space-y-4">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
              size="lg"
            >
              Send Recovery Instructions
            </Button>

            <div className="text-center">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent font-medium transition-colors"
              >
                <FiArrowLeft size={15} /> Return to Log In
              </Link>
            </div>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

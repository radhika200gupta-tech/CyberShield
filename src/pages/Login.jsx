import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROUTES } from '../constants/routes';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const next = {};
    const trimmedEmail = form.email.trim();

    if (!trimmedEmail) {
      next.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      next.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      next.password = 'Password is required.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, email: val }));
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
    if (authError) setAuthError('');
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, password: val }));
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
    if (authError) setAuthError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);
    setAuthError('');

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });

      showToast('Welcome back! Logged in successfully.', 'success');
      const from = location.state?.from;
      const destination = from
        ? (typeof from === 'string' ? from : `${from.pathname || ROUTES.DASHBOARD}${from.search || ''}${from.hash || ''}`)
        : ROUTES.DASHBOARD;
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Authentication error:', err);
      const msg = err?.message || 'Authentication failed. Please check your credentials and try again.';
      setAuthError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to view your live security dashboard.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="Email"
          type="email"
          name="email"
          icon={FiMail}
          placeholder="you@company.com"
          value={form.email}
          onChange={handleEmailChange}
          error={errors.email}
          autoComplete="email"
          disabled={isSubmitting}
        />

        <div className="space-y-2">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            icon={FiLock}
            placeholder="••••••••"
            value={form.password}
            onChange={handlePasswordChange}
            error={errors.password}
            autoComplete="current-password"
            disabled={isSubmitting}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
              </button>
            }
          />

          <div className="flex justify-end pt-1">
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-[13px] font-medium text-accent hover:text-accent/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {authError && (
          <p className="text-xs text-danger text-center font-medium pt-1 animate-fade-in" role="alert">
            {authError}
          </p>
        )}

        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
            size="lg"
          >
            Log In
          </Button>
        </div>
      </form>

      <p className="text-sm text-text-secondary text-center mt-6">
        Don&rsquo;t have an account?{' '}
        <Link to={ROUTES.SIGNUP} className="text-accent hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROUTES } from '../constants/routes';

export default function SignUp() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth(); // Simulating signup by just logging them in for now
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const next = {};
    if (!form.name) next.name = 'Full Name is required.';
    if (!form.email) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    await login({ email: form.email, password: form.password });
    setIsSubmitting(false);
    showToast('Account created successfully!', 'success');
    navigate(ROUTES.DASHBOARD, { replace: true });
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join CyberShield to secure your digital footprint.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          name="name"
          icon={FiUser}
          placeholder="Jane Doe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          name="email"
          icon={FiMail}
          placeholder="you@company.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          icon={FiLock}
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          autoComplete="new-password"
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
            </button>
          }
        />
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          icon={FiLock}
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          error={errors.confirmPassword}
          autoComplete="new-password"
          endAdornment={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              {showConfirmPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
            </button>
          }
        />

        <div className="pt-3">
          <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting} size="lg">
            Create Account
          </Button>
        </div>
      </form>

      <p className="text-sm text-text-secondary text-center mt-6">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-accent hover:underline font-medium">
          Log In
        </Link>
      </p>
    </AuthLayout>
  );
}

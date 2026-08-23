import { motion } from 'framer-motion';
import { classNames } from '../../utils/formatters';

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-dim shadow-[0_0_0_1px_rgba(139,92,246,0.4)] hover:shadow-[0_0_24px_-4px_rgba(139,92,246,0.6)]',
  accent: 'bg-accent text-[#07070A] hover:brightness-110 shadow-[0_0_24px_-6px_rgba(167,139,250,0.7)]',
  outline: 'border border-border text-text-primary hover:border-border-hover hover:bg-surface-hover',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
  danger: 'bg-danger text-white hover:brightness-110',
};

const SIZES = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      disabled={disabled || isLoading}
      className={classNames(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={16} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={16} />}
        </>
      )}
    </motion.button>
  );
}

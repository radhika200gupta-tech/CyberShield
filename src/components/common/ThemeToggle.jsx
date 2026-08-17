import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { classNames } from '../../utils/formatters';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle color theme"
      className={classNames(
        'relative inline-flex items-center w-14 h-8 rounded-full border border-border bg-bg-elevated transition-colors',
        className
      )}
    >
      <span
        className={classNames(
          'absolute top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-surface border border-border shadow-sm transition-transform duration-300',
          isDark ? 'translate-x-6' : 'translate-x-0.5'
        )}
      >
        {isDark ? <FiMoon size={13} className="text-accent" /> : <FiSun size={13} className="text-warning" />}
      </span>
    </button>
  );
}

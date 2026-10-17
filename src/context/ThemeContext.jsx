import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

// Temporarily enforce dark mode as the only active theme
const ENFORCE_DARK_MODE_ONLY = true;

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (ENFORCE_DARK_MODE_ONLY) return 'dark';
    return localStorage.getItem('cybershield-theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    
    const activeTheme = ENFORCE_DARK_MODE_ONLY ? 'dark' : (
      theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme
    );
    
    root.classList.add(activeTheme);
    localStorage.setItem('cybershield-theme', activeTheme);
  }, [theme]);

  // Optional: Listen for system preference changes if in 'system' mode
  useEffect(() => {
    if (ENFORCE_DARK_MODE_ONLY || theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => {
    if (ENFORCE_DARK_MODE_ONLY) return 'dark';
    if (prev === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isDark ? 'light' : 'dark';
    }
    return prev === 'dark' ? 'light' : 'dark';
  });

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

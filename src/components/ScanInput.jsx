import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLink, FiSearch } from 'react-icons/fi';
import { classNames } from '../utils/classNames';

export default function ScanInput({ onAnalyze, isScanning }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) {
      setError('Paste a link to check.');
      return;
    }
    setError('');
    onAnalyze(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={classNames(
          'rounded-card border p-5 sm:p-6 bg-surface transition-colors',
          error ? 'border-danger' : 'border-border hover:border-border-hover'
        )}
      >
        <label htmlFor="url-input" className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
          <FiLink size={16} className="text-accent" />
          Paste a link to check if it's safe
        </label>

        <div className="relative">
          <input
            id="url-input"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError('');
            }}
            disabled={isScanning}
            placeholder="https://example.com/login"
            autoComplete="off"
            spellCheck="false"
            className={classNames(
              'w-full bg-bg-elevated border rounded-lg py-3.5 pl-4 pr-4 text-sm sm:text-base font-mono text-text-primary placeholder:text-text-muted transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              error ? 'border-danger' : 'border-border hover:border-border-hover'
            )}
          />
        </div>

        {error && <p className="mt-2 text-xs text-danger">{error}</p>}

        <div className="mt-4 flex justify-end">
          <motion.button
            type="submit"
            whileTap={{ scale: isScanning ? 1 : 0.97 }}
            disabled={isScanning}
            className={classNames(
              'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 cursor-pointer',
              'text-sm px-5 py-2.5',
              'bg-primary text-white hover:bg-primary-dim shadow-[0_0_0_1px_rgba(139,92,246,0.4)] hover:shadow-[0_0_24px_-4px_rgba(139,92,246,0.6)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isScanning ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiSearch size={16} />
            )}
            CHECK THIS LINK
          </motion.button>
        </div>
      </div>
    </form>
  );
}

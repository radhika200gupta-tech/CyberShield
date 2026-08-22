import { forwardRef } from 'react';
import { classNames } from '../../utils/formatters';

const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, endAdornment, id, className = '', ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        )}
        <input
          ref={ref}
          id={inputId}
          className={classNames(
            'w-full bg-bg-elevated border rounded-lg py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent',
            Icon ? 'pl-10' : 'pl-3.5',
            endAdornment ? 'pr-10' : 'pr-3.5',
            error ? 'border-danger' : 'border-border hover:border-border-hover',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {endAdornment && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{endAdornment}</div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger">{error}</p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-text-muted">{hint}</p>
      )}
    </div>
  );
});

export default Input;

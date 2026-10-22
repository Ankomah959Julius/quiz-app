import React, { useId } from 'react';

function FieldShell({ id, label, hint, error, required, children, action }) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={id} className="field__label">
          <span>
            {label}
            {required && (
              <span className="field__required" aria-hidden="true">
                *
              </span>
            )}
          </span>
          {action}
        </label>
      )}
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && (
        <span className="field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function Input({ label, hint, error, id: customId, className = '', required = false, icon, action, ...props }) {
  const generatedId = useId();
  const id = customId || generatedId;
  const hasAdornment = Boolean(icon || action);

  const control = (
    <input
      id={id}
      className={`input ${error ? 'input--error' : ''} ${className}`}
      required={required}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    />
  );

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      {hasAdornment ? (
        <div className="input-group">
          {icon && (
            <span className="input-group__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          {control}
          {action && <span className="input-group__action">{action}</span>}
        </div>
      ) : (
        control
      )}
    </FieldShell>
  );
}

export function Select({ label, hint, error, options = [], children, id: customId, className = '', required = false, ...props }) {
  const generatedId = useId();
  const id = customId || generatedId;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        className={`select ${error ? 'select--error' : ''} ${className}`}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </select>
    </FieldShell>
  );
}

export function Textarea({ label, hint, error, id: customId, className = '', rows = 4, required = false, ...props }) {
  const generatedId = useId();
  const id = customId || generatedId;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        rows={rows}
        className={`textarea ${error ? 'textarea--error' : ''} ${className}`}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    </FieldShell>
  );
}

export function Checkbox({ label, id: customId, className = '', ...props }) {
  const generatedId = useId();
  const id = customId || generatedId;

  return (
    <label htmlFor={id} className={`checkbox ${className}`}>
      <input id={id} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}

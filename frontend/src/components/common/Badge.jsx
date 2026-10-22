import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  icon = null,
  dot = false,
  className = '',
  ...props
}) {
  return (
    <span className={`badge badge--${variant} ${className}`} {...props}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {icon && (
        <span className="btn__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

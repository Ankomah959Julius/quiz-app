import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon = null,
  iconRight = null,
  block = false,
  className = '',
  disabled = false,
  as: Component = 'button',
  type,
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    block ? 'btn--block' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const isNativeButton = Component === 'button';

  return (
    <Component
      className={classes}
      {...(isNativeButton ? { type: type || 'button', disabled: disabled || isLoading } : {})}
      {...(isNativeButton ? {} : { 'aria-disabled': disabled || isLoading ? 'true' : undefined })}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <span className="spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="btn__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children != null && <span>{children}</span>}
      {iconRight && !isLoading && (
        <span className="btn__icon" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </Component>
  );
}

import React from 'react';
import { Info, AlertTriangle, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  neutral: Info,
  info: Info
};

export default function Alert({
  variant = 'info',
  title,
  children,
  icon = true,
  className = '',
  ...props
}) {
  const Icon = ICONS[variant] || Info;

  return (
    <div className={`alert alert--${variant} ${className}`} role="status" {...props}>
      {icon && (
        <span className="alert__icon" aria-hidden="true">
          <Icon size={18} />
        </span>
      )}
      <div style={{ minWidth: 0 }}>
        {title && <div className="alert__title">{title}</div>}
        <div className="alert__body">{children}</div>
      </div>
    </div>
  );
}

export function SecurityAlert({ title = 'Security boundary enforced', children, ...props }) {
  return (
    <div className={`alert alert--neutral ${props.className || ''}`} role="status" {...props}>
      <span className="alert__icon" aria-hidden="true">
        <ShieldAlert size={18} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="alert__title">{title}</div>
        <div className="alert__body">{children}</div>
      </div>
    </div>
  );
}

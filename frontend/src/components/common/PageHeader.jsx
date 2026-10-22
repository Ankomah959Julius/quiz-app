import React from 'react';

export default function PageHeader({
  eyebrow = null,
  title,
  subtitle,
  actions = null,
  children,
  className = ''
}) {
  return (
    <header className={`page-header ${className}`}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="page-header__eyebrow">{eyebrow}</div>}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

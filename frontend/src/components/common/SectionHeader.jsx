import React from 'react';

export default function SectionHeader({ title, description, icon, actions = null, className = '' }) {
  return (
    <div className={`section__header ${className}`}>
      <div style={{ minWidth: 0 }}>
        <h2 className="section__title">
          {icon && (
            <span aria-hidden="true" style={{ color: 'var(--accent-text)', display: 'inline-flex' }}>
              {icon}
            </span>
          )}
          {title}
        </h2>
        {description && <p className="section__desc">{description}</p>}
      </div>
      {actions && <div className="row row-2">{actions}</div>}
    </div>
  );
}

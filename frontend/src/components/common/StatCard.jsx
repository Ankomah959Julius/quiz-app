import React from 'react';

export default function StatCard({ label, value, hint, icon, tone = 'brand', className = '' }) {
  const toneClass = tone === 'brand' ? '' : ` stat__icon--${tone}`;

  return (
    <article className={`stat ${className}`}>
      <div className="stat__top">
        <span className="stat__label">{label}</span>
        {icon && (
          <span className={`stat__icon ${toneClass}`} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div className="stat__value">{value}</div>
      {hint && <div className="stat__hint">{hint}</div>}
    </article>
  );
}

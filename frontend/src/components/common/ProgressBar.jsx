import React from 'react';

export default function ProgressBar({
  value = 0,
  max = 100,
  label = '',
  showValue = true,
  height = 8,
  tone = 'brand',
  valueFormatter,
  className = ''
}) {
  const safeMax = max > 0 ? max : 100;
  const percentage = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));
  const display = valueFormatter ? valueFormatter(value, safeMax) : `${percentage}%`;

  const toneClass =
    tone === 'success' || tone === 'warning' || tone === 'danger' ? ` progress__fill--${tone}` : '';

  return (
    <div className={`progress ${className}`}>
      {(label || showValue) && (
        <div className="progress__meta">
          {label && <span>{label}</span>}
          {showValue && <span className="progress__value">{display}</span>}
        </div>
      )}
      <div
        className="progress__track"
        style={{ height: `${height}px` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label || 'Progress'}
      >
        <div className={`progress__fill ${toneClass}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

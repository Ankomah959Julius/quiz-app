import React from 'react';

export default function SegmentedControl({ items, value, onChange, ariaLabel, className = '' }) {
  return (
    <div className={`segmented ${className}`} role="group" aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isActive}
            className="segmented__item"
            onClick={() => onChange && onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

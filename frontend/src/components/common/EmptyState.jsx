import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'There are no records to display at this time.',
  icon = null,
  actionLabel = null,
  onAction = null,
  className = ''
}) {
  return (
    <div className={`card ${className}`}>
      <div className="empty-state">
        <div className="empty-state__icon" aria-hidden="true">
          {icon || <Inbox size={24} />}
        </div>
        <h3 className="empty-state__title">{title}</h3>
        <p className="empty-state__desc">{description}</p>
        {actionLabel && onAction && (
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

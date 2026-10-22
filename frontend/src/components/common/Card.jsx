import React from 'react';

export function Card({ children, interactive = false, accent = false, className = '', ...props }) {
  const classes = [
    'card',
    interactive ? 'card--interactive' : '',
    accent ? 'card--accent' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, plain = false, className = '', ...props }) {
  return (
    <div className={`card__header ${plain ? 'card__header--plain' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', as = 'h3', ...props }) {
  const Component = as;
  return (
    <Component className={`card__title ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`card__description ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, flush = false, tight = false, className = '', ...props }) {
  return (
    <div
      className={`card__body ${flush ? 'card__body--flush' : ''} ${tight ? 'card__body--tight' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`card__footer ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;

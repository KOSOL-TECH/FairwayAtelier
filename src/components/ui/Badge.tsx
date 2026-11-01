import type { ReactNode } from 'react';

export interface BadgeProps {
  tone?: 'brass' | 'green' | 'stone' | 'inverse' | 'booking' | 'limited' | 'sold' | 'waitlist';
  /** Leading status dot */
  dot?: boolean;
  children?: ReactNode;
}

export function Badge({ tone = 'brass', dot = false, children }: BadgeProps) {
  return (
    <span className={`fa-badge fa-badge--${tone}`}>
      {dot && <span className="fa-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

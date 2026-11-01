import type { CSSProperties, ReactNode } from 'react';
import { Badge } from './Badge';
import { cx } from './cx';

export interface CardProps {
  image?: string; imageAlt?: string;
  /** Uppercase brass label above title */
  eyebrow?: string;
  title?: string;
  /** Corner badge over image */
  badge?: string;
  footer?: ReactNode;
  hoverLift?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}

export function Card({ image, imageAlt, eyebrow, title, children, badge, footer, hoverLift = true, style }: CardProps) {
  return (
    <div className={cx('fa-card', hoverLift && 'fa-card--lift')} style={style}>
      {image && (
        <div className="fa-card__media">
          <img src={image} alt={imageAlt || ''} loading="lazy" decoding="async" />
          {badge && <div className="fa-card__badge"><Badge tone="inverse">{badge}</Badge></div>}
        </div>
      )}
      <div className="fa-card__body">
        {eyebrow && <div className="label">{eyebrow}</div>}
        {title && <div className="fa-card__title">{title}</div>}
        {children && <div className="fa-card__content">{children}</div>}
        {footer && <div className="fa-card__footer">{footer}</div>}
      </div>
    </div>
  );
}

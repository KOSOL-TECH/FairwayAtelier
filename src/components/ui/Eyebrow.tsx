import type { ReactNode } from 'react';
import { cx } from './cx';

export interface EyebrowProps {
  /** Show flanking brass rules (—— LABEL ——) */
  rules?: boolean;
  tone?: 'ink' | 'brass';
  align?: 'center' | 'left';
  children?: ReactNode;
}

export function Eyebrow({ children, rules = false, tone = 'ink', align = 'center' }: EyebrowProps) {
  return (
    <div className={cx('fa-eyebrow', tone === 'brass' && 'fa-eyebrow--brass', align === 'left' && 'fa-eyebrow--left')}>
      {rules && <span className="fa-eyebrow__rule" aria-hidden="true" />}
      <span className="fa-eyebrow__label">{children}</span>
      {rules && <span className="fa-eyebrow__rule" aria-hidden="true" />}
    </div>
  );
}

import type { CSSProperties } from 'react';
import { cx } from './cx';

export interface DividerProps {
  /** Center diamond ornament */
  ornament?: boolean;
  tone?: 'hairline' | 'brass';
  style?: CSSProperties;
}

export function Divider({ ornament = false, tone = 'hairline', style }: DividerProps) {
  if (!ornament) return <hr className={cx('fa-divider', tone === 'brass' && 'fa-divider--brass')} style={style} />;
  return (
    <div className={cx('fa-divider-ornament', tone === 'brass' && 'fa-divider-ornament--brass')} style={style} role="separator">
      <span className="fa-divider-ornament__line" />
      <span className="fa-divider-ornament__diamond" />
      <span className="fa-divider-ornament__line" />
    </div>
  );
}

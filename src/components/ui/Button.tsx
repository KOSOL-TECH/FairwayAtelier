import type { CSSProperties, ReactNode } from 'react';
import { cx } from './cx';

export interface ButtonProps {
  /** 'primary' green fill | 'secondary' charcoal outline | 'ghost' brass-underlined text */
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  style?: CSSProperties;
  /** Renders a link instead of a button (navigation) */
  href?: string;
  type?: 'button' | 'submit';
  /** Shows the busy state while a request is in flight */
  busy?: boolean;
  className?: string;
}

export function Button({ variant = 'primary', size = 'md', disabled = false, onClick, children, style, href, type = 'button', busy, className }: ButtonProps) {
  const cls = cx('fa-btn', `fa-btn--${variant}`, variant !== 'ghost' && `fa-btn--${size}`, className);
  if (href && !disabled) {
    return <a className={cls} href={href} style={style}>{children}</a>;
  }
  return (
    <button type={type} className={cls} style={style} disabled={disabled || busy} aria-busy={busy || undefined} onClick={onClick}>
      {children}
    </button>
  );
}
